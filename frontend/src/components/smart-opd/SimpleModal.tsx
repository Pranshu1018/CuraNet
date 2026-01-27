import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimpleModal: React.FC<SimpleModalProps> = ({ isOpen, onClose }) => {
  console.log('SimpleModal rendered, isOpen:', isOpen);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Simple Modal Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>This is a simple modal without Radix UI Dialog.</p>
          <p>If you can see this, the issue is with the Dialog component.</p>
          <p>Current state: {isOpen ? 'OPEN' : 'CLOSED'}</p>
          <Button onClick={onClose}>Close</Button>
        </CardContent>
      </Card>
    </div>
  );
};
