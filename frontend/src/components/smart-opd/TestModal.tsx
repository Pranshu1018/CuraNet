import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestModal: React.FC<TestModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Test Modal</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>This is a test modal to verify Dialog component is working.</p>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
