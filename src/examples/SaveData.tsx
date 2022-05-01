import { FC, useEffect } from "react";
import {
  FormControl,
  FormGroup,
  useFormConfig,
  Validators,
  WControlData,
  WForm,
  WFormControl,
} from "react-angular-forms";
import { delay, of } from "rxjs";
import { WInputText } from "../TemplateContainer/InputTemplates";
import { SaveButton } from "../TemplateContainer/SaveButton";
import { TemplateInputContainer } from "../TemplateContainer/TemplateContainer";

export const SaveData: FC<any> = () => {
  const formConfig = useFormConfig({
    createForm: (data) => {
      console.log(data);

      const form = new FormGroup({
        nombre: new FormControl(null, [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(10),
        ]),
        apellido: new FormControl(),
      });

      return form;
    },
    onFormLoaded: (form, data) => {
      console.log("onFormLoaded");
      console.log(data);
      form.patchValue(data);
    },
    onSubmit: (form, { processing, succeed, failed }) => {
      if (form.invalid) {
        // alert("Formulario Invalidio");
        return;
      }
      processing();

      of({ nombre: "Juan", apellido: "perez" })
        .pipe(delay(3000))
        .toPromise()
        .then((data) => {
          succeed(data);
        });
    },
  });

  const { loadSucceed, loadProcessing } = formConfig;

  useEffect(() => {
    loadProcessing();
    of({ nombre: "Juan", apellido: "perez" })
      .pipe(delay(3000))
      .toPromise()
      .then((data) => {
        loadSucceed(data);
      });
  }, []);

  return (
    <>
      <WForm
        formConfig={formConfig}
        globalErrorMessages={{
          minlength: (val: any) => {
            return `El valor tiene ${val.actualLength}  ha superado el maximo. Pero debe tener minmo ${val.requiredLength}`;
          },
          maxlength: `Max value`,
        }}
      >
        <WControlData />
        <div className="p-grid">
          <div className="p-md-2">
            <WFormControl name="nombre">
              <TemplateInputContainer label="Nombre">
                <WInputText />
              </TemplateInputContainer>
            </WFormControl>
          </div>
          <div className="p-md-2">
            <WFormControl name="apellido" errorMessages={{ maxLength: "sss" }}>
              <TemplateInputContainer label="Apellido">
                <WInputText />
              </TemplateInputContainer>
            </WFormControl>
          </div>
        </div>
        <SaveButton label="GUARDAR DOCUMENTO" />
      </WForm>
    </>
  );
};
