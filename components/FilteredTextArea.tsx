import React, { useCallback, useEffect, useRef } from "react";

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
      e.currentTarget.value = [
        ...chunks(
          [
            ...chunks(
              e.currentTarget.value.replace(/[^a-z0-9]/gi, "").split(""),
              2
            ),
          ].map((pair) => pair.join("")),
          6
        ),
      ]
        .map((row) => row.join(" "))
        .join("\n");
      const newValue = e.currentTarget.value;
      const validationMsg = validate(newValue);
      textAreaEl.current.setCustomValidity(validationMsg);

      if (onChange) {
        onChange(e);
      }
    },
    [validate, textAreaEl, onChange]
  );

  return (
    <textarea
      ref={textAreaEl}
      {...textAreaProps}
      onChange={handleChange}
      data-testid="foo"
    />
  );
}
function* chunks(arr, n) {
  for (let i = 0; i < arr.length; i += n) {
    yield arr.slice(i, i + n);
  }
}
