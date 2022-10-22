import React, { useCallback, useRef } from "react";

type ValidationMessage = string;
export type FilteredTextAreaValidator = (value: string) => ValidationMessage;

export interface FilteredTextAreaProps
  extends Omit<React.HTMLProps<HTMLTextAreaElement>, "onChange"> {
  validate: FilteredTextAreaValidator;
  onChange: (value: string) => void;
}

const autocompletions = ["1C", "55", "7A", "BD", "E9", "FF"].reduce(
  (acc, val) => {
    for (const char of val) {
      acc.set(char.toLowerCase(), val);
    }
    return acc;
  },
  new Map<string, string>()
);

const isAutocompletableKey = (key: string) => {
  return autocompletions.has(key);
};
const autocomplete = (key: string) => {
  return autocompletions.get(key);
};

export default function FilteredTextArea(props: FilteredTextAreaProps) {
  const { validate, onChange, ...textAreaProps } = props;
  const textAreaEl = useRef<HTMLTextAreaElement>();

  const _handleChange = useCallback(
    (newValue: string) => {
      const validationMsg = validate(newValue);
      textAreaEl.current.setCustomValidity(validationMsg);

      onChange && onChange(newValue);
    },
    [validate, textAreaEl, onChange]
  );
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.currentTarget.value;
      _handleChange(newValue);
    },
    [validate, textAreaEl, onChange]
  );

  return (
    <textarea
      ref={textAreaEl}
      {...textAreaProps}
      onChange={handleChange}
      onKeyDown={(e) => {
        if (e.ctrlKey || e.altKey || e.metaKey) {
          // ignore ctrl+a etc
          return;
        }

        const key = e.key.toLowerCase();
        const elem = e.currentTarget as HTMLTextAreaElement;

        if (isAutocompletableKey(key)) {
          const octet = autocomplete(key);
          if (!octet) return;

          const value = (textAreaProps.value as string) || "";
          const start = value.slice(0, elem.selectionStart);
          const end = value.slice(elem.selectionEnd);
          const newValue = start + octet + " " + end;

          _handleChange(newValue);

          e.preventDefault();
          e.stopPropagation();
          return;
        }

        // erasing individiual octet or character
        if (key === "backspace" && elem.selectionStart === elem.selectionEnd) {
          const value = (textAreaProps.value as string) || "";

          const idx = value
            .slice(0, elem.selectionStart)
            .search(/[\w\d]+[\t ]*$/);

          if (idx === -1) {
            return;
          }

          const start = value.slice(0, idx);
          const end = value.slice(elem.selectionStart);
          _handleChange(start + end);

          e.preventDefault();
          e.stopPropagation();
        }
      }}
    />
  );
}
