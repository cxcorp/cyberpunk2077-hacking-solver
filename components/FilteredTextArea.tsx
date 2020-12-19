import React, { useCallback } from "react";

export interface FilteredTextAreaProps
  extends React.HTMLProps<HTMLTextAreaElement> {
  regex: RegExp;
}

export default function FilteredTextArea(props: FilteredTextAreaProps) {
  const { regex, ...textAreaProps } = props;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.currentTarget.value;
      if (newValue.length > 0 && !regex.test(newValue)) {
        return;
      }
      props.onChange && props.onChange(e);
    },
    [regex, props.onChange]
  );

  return <textarea {...textAreaProps} onChange={handleChange} />;
}
