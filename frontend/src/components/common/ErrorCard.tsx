import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ErrorCardProps {
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

const ErrorCard = ({ 
  message, 
  onRetry, 
  retryText = "Try Again" 
}: ErrorCardProps) => {
  return (
    <div className="flex items-center justify-center py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{message}</p>
          {onRetry && (
            <Button onClick={onRetry} className="mt-4">
              {retryText}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorCard;