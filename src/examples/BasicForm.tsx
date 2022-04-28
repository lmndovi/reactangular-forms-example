import { FC, useEffect, useState } from "react";
import {
  FormControl,
  FormGroup,
  useFormConfig,
  Validators,
  WControlData,
  WForm,
  WFormControl,
  WFormGroup,
} from "react-angular-forms";
import { WDropDown, WInputText } from "../TemplateContainer/InputTemplates";
import { TemplateInputContainer } from "../TemplateContainer/TemplateContainer";

export const BasicForm: FC<any> = () => {
  const asd = useState();

  // const example= {
  //     name:'',     //FC
  //     document:{   //FG
  //       type:'asd', //FC
  //       number:''
  //     },
  //     aaaaa:{      // FG
  //       ssssss:{  // FG
  //         ttt:{  // FG
  //           fffffff:true // FC
  //            }
  //         }
  //       }
  //     }

  // }
  const formConfig = useFormConfig({
    createForm: () => {
      // FormControl, FormGroup , FormArray

      const form = new FormGroup({
        name: new FormControl(null, [
          Validators.required,
          Validators.minLength(8),
        ]),
        document: new FormGroup({
          type: new FormControl(), //'document.type' || 'type'
          number: new FormControl(),
        }),
        aaaaa: new FormGroup({
          ssssss: new FormGroup({
            ttt: new FormGroup({
              fffffff: new FormControl(),
            }),
          }),
        }),
      });
      return form;
    },
  });
  const { loadSucceed } = formConfig;
  useEffect(() => {
    loadSucceed({});
  }, []);
  return (
    <>
      <WForm formConfig={formConfig}>
        <WControlData />
        <div className="p-grid">
          <div className="p-md-2">
            <WFormControl name="name">
              <TemplateInputContainer label="Name">
                <WInputText />
              </TemplateInputContainer>
            </WFormControl>
          </div>
          <div className="p-md-2">
            <WFormControl name="aaaaa.ssssss.ttt.fffffff">
              <TemplateInputContainer label="FFFFFFFF">
                <WInputText />
              </TemplateInputContainer>
            </WFormControl>
          </div>
          <div className="p-md-2">
            <WFormControl name="aaaaa.ssssss.ttt.fffffff">
              <TemplateInputContainer label="FFFFFFFF">
                <WInputText />
              </TemplateInputContainer>
            </WFormControl>
          </div>
          <WFormGroup name="document">
            <div className="p-md-2">
              <WFormControl name="type">
                <TemplateInputContainer label="DOcument Type">
                  <WInputText />
                </TemplateInputContainer>
              </WFormControl>
            </div>
            <div className="p-md-2">
              <WFormControl name="number">
                <TemplateInputContainer label="DOcument Number">
                  <WDropDown
                    options={[
                      { name: "OPt1", value: 1 },
                      { name: "OPt2", value: 2 },
                    ]}
                    optionLabel="name"
                  />
                </TemplateInputContainer>
              </WFormControl>
            </div>
          </WFormGroup>
        </div>
      </WForm>
    </>
  );
};
