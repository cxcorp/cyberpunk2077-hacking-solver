import React, { useCallback, useRef } from "react";

type ValidationMessage = string;
export type FilteredTextAreaValidator = (value: string) => ValidationMessage;

export interface FilteredTextAreaProps
  extends React.HTMLProps<HTMLTextAreaElement> {
  validate: FilteredTextAreaValidator;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export default function FilteredTextArea(props: FilteredTextAreaProps) {
  const { validate, onChange, ...textAreaProps } = props;
  const textAreaEl = useRef<HTMLTextAreaElement>();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.currentTarget.value;
      const validationMsg = validate(newValue);
      textAreaEl.current.setCustomValidity(validationMsg);

      onChange && onChange(e);
    },
    [validate, textAreaEl, onChange]
  );

  return (
    <textarea ref={textAreaEl} {...textAreaProps} onChange={handleChange} />
  );
}
