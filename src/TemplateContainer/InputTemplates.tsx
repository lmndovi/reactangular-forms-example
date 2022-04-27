import { Dropdown, DropdownProps } from "primereact/dropdown";
import { InputText, InputTextProps } from "primereact/inputtext";
import React, { FC } from "react";
import { useControlContext } from "react-angular-forms";

type WInputTextProps = Omit<
  InputTextProps,
  "value" | "onChange" | "onBlur" | "disabled"
>;

export const WInputText = (custom: WInputTextProps = {}) => {
  const { validationErrors, control } = useControlContext();
  const { value, disabled, onChange, onBlur, load } = control;

  return (
    <InputText
      value={value || ""}
      disabled={disabled}
      className={validationErrors ? "p-invalid" : ""}
      onChange={onChange}
      onBlur={onBlur}
      {...custom}
    />
  );
};

// type WInputTextProps = Omit<InputTextProps, "value" | "onChange" | "onBlur">;

export const WDropDown: FC<DropdownProps> = (props) => {
  const { validationErrors, control } = useControlContext();
  const { value, disabled, onChange, onBlur, load } = control;
  return (
    <Dropdown
      value={value || ""}
      disabled={disabled}
      className={validationErrors ? "p-invalid" : ""}
      onChange={onChange}
      onBlur={onBlur}
      {...(props as any)}
    />
  );
};
