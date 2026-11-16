"use client";
import { Modal } from "@/components/Modal";
import { RequestForm } from "@/components/RequestForm";

type Props = {
  open: boolean;
  onClose: () => void;
  types?: string[];
  initialType?: string;
  initialValues?: Record<string, string>;
};

// Окно новой заявки. Форма создаётся заново при каждом открытии, поэтому подставленные даты не «залипают»
export function RequestModal({ open, onClose, types, initialType, initialValues }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Новая заявка">
      <RequestForm types={types} initialType={initialType} initialValues={initialValues} onDone={onClose} />
    </Modal>
  );
}
