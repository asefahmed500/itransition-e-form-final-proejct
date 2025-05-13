import { NextResponse } from "next/server";
import Template from "@/lib/models/Template";
import Response from "@/lib/models/Response";
import User from "@/lib/models/User";


interface QuestionStats {
  average?: number;
  min?: number;
  max?: number;
  topAnswers?: { answer: string; count: number }[];
  optionCounts?: Record<string, number>;
}

interface TemplateQuestion {
  id: string;
  type: string;
  question: string;
  description?: string;
  options?: string[];
  required: boolean;
}

// Removed unused TemplateWithStats interface

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json(
      { error: "API token is required" },
      { status: 400 }
    );
  }

  try {
    // UTC-based expiration check
    const sevenDaysAgoUTC = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    sevenDaysAgoUTC.setUTCHours(0, 0, 0, 0);

    const user = await User.findOne({
      odooToken: token,
      odooTokenGeneratedAt: {
        $gte: sevenDaysAgoUTC,
        $lte: new Date(), // Ensure not future dated
      },
    }).select("_id name email odooTokenGeneratedAt");

    if (!user) {
      console.error("Token validation failed", {
        tokenExists: !!(await User.exists({ odooToken: token })),
        timeWindow: {
          from: sevenDaysAgoUTC,
          to: new Date(),
        },
      });
      return NextResponse.json(
        { error: "Invalid or expired API token" },
        { status: 401 }
      );
    }

    const templates = await Template.find({ owner: user._id })
      .lean()
      .populate("owner", "name email");

    const templatesWithStats = await Promise.all(
      templates.map(async (template) => {
        const responses = await Response.find({ form: template._id });

        const questionsWithStats = template.questions.map(
          (question: TemplateQuestion) => {
            const answers = responses
              .flatMap((response) =>
                response.answers
                  .filter((a: { questionId: string; answer: string | number | string[] }) => a.questionId === question.id)
                  .map((a: { questionId: string; answer: string | number | string[] }) => a.answer)
              )
              .filter(Boolean);

            return {
              ...question,
              stats: calculateStats(question.type, answers),
            };
          }
        );

        return {
          ...template,
          questions: questionsWithStats,
          responseCount: responses.length,
          owner: {
            _id: user._id,
            name: user.name,
            email: user.email,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: templatesWithStats,
      generatedAt: user.odooTokenGeneratedAt,
      expiresAt: new Date(
        user.odooTokenGeneratedAt.getTime() + 7 * 24 * 60 * 60 * 1000
      ),
    });
  } catch (error) {
    console.error("Data export error:", error);
    return NextResponse.json(
      { error: "Failed to export form data" },
      { status: 500 }
    );
  }
}

function calculateStats(
  type: string,
  answers: (string | number | string[])[]
): QuestionStats | null {
  if (answers.length === 0) return null;

  switch (type) {
    case "rating":
    case "number": {
      const nums = answers.map((a) =>
        typeof a === "string" ? parseFloat(a) : Number(a)
      );
      const validNums = nums.filter((n) => !isNaN(n));
      if (validNums.length === 0) return null;

      return {
        average: validNums.reduce((a, b) => a + b, 0) / validNums.length,
        min: Math.min(...validNums),
        max: Math.max(...validNums),
      };
    }

    case "text": {
      const counts: Record<string, number> = {};
      answers.forEach((a) => {
        const str = String(a);
        counts[str] = (counts[str] || 0) + 1;
      });

      const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      return {
        topAnswers: sorted.map(([answer, count]) => ({ answer, count })),
      };
    }

    case "multiple-choice":
    case "checkbox":
    case "dropdown": {
      const optionCounts: Record<string, number> = {};
      answers.forEach((a) => {
        const options = Array.isArray(a) ? a : [a];
        options.forEach((opt) => {
          const key = String(opt);
          optionCounts[key] = (optionCounts[key] || 0) + 1;
        });
      });

      return { optionCounts };
    }

    default:
      return null;
  }
}
