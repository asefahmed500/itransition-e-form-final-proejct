import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/utils/dbConnect";
import { authOptions } from "../auth/[...nextauth]/route";
import Form from "@/lib/models/Form";
import Response from "@/lib/models/Response";
import Template from "@/lib/models/Template";


export async function GET() {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [formsCount, responsesCount, templatesCount] = await Promise.all([
      Form.countDocuments({ owner: session.user.id }),
      Response.countDocuments({
        form: { $in: await Form.find({ owner: session.user.id }).distinct('_id') }
      }),
      Template.countDocuments({ owner: session.user.id })
    ]);

    // Get response trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const responsesTrend = await Response.aggregate([
      {
        $match: {
          form: { $in: await Form.find({ owner: session.user.id }).distinct('_id') },
          submittedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return NextResponse.json({
      formsCount,
      responsesCount,
      templatesCount,
      responsesTrend
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}