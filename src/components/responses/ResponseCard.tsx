import { IResponse } from "@/lib/models/Response";
import { IQuestion } from "@/lib/models/Form";

interface ResponseCardProps {
  response: IResponse;
  formQuestions: IQuestion[];
}

export default function ResponseCard({ response, formQuestions }: ResponseCardProps) {
  // Helper function to get formatted date
  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  // Helper function to render answer based on question type
  const renderAnswer = (questionId: string, answer: string | number | string[] | null) => {
    const question = formQuestions.find(q => q.id === questionId);
    
    if (!question) return <span className="text-gray-500">Unknown question</span>;
    
    switch (question.type) {
      case "multiple-choice":
      case "checkbox":
        if (Array.isArray(answer)) {
          return answer.join(", ");
        }
        return answer;
      case "rating":
        return `${answer}/5`;
      case "date":
      case "time":
      case "text":
      case "dropdown":
      default:
        return answer;
    }
  };

  // Get user information
  const userName = typeof response.user === "object" && "name" in response.user
    ? (response.user.name as string)
    : "Anonymous";

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg">{userName}</h3>
          <p className="text-gray-500 text-sm">
            Submitted: {formatDate(response.submittedAt)}
          </p>
        </div>
      </div>
      
      <div className="space-y-4 mt-4">
        {response.answers.map((answer, index) => (
          <div key={index} className="border-t pt-4">
            <p className="font-medium">
              {formQuestions.find(q => q.id === answer.questionId)?.question || "Unknown question"}
            </p>
            <p className="text-gray-700 mt-1">
              {renderAnswer(answer.questionId, answer.answer)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}