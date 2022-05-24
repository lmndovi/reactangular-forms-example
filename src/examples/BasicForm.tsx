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
import { SaveButton } from "../TemplateContainer/SaveButton";


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
        address: new FormGroup({
          street: new FormControl(), 
          city: new FormControl(),
          zip: new FormControl(),
        }),
        education: new FormGroup({
          undergraduate: new FormGroup({
              institution: new FormControl(), 
              graduationYear: new FormControl(),
          }),
          postgraduate: new FormGroup({
              institution: new FormControl(), 
              graduationYear: new FormControl(),
        }),
      })
    })
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
        <WFormGroup name= "address">
          <div className="p-md-2">
            <WFormControl name="street">
              <TemplateInputContainer label="Street">
                <WInputText />
              </TemplateInputContainer>
            </WFormControl>
          {/* </div>
          <div className="p-md-2"> */}
            <WFormControl name="city">
              <TemplateInputContainer label="City">
                <WInputText />
              </TemplateInputContainer>
            </WFormControl>
          {/* </div>
          <div className="p-md-2"> */}
            <WFormControl name="zip">
              <TemplateInputContainer label="Zip Code">
                <WInputText />
              </TemplateInputContainer>
            </WFormControl>
          </div>
        </WFormGroup>

          <WFormGroup name="education">
            <WFormGroup name="undergraduate">
            <div className="p-md-2">
              <WFormControl name="institution">
                <TemplateInputContainer label="University Name">
                  <WInputText />
                </TemplateInputContainer>
              </WFormControl>
            {/* </div>
            <div className="p-md-2"> */}
              <WFormControl name="graduationYear">
                <TemplateInputContainer label="Graduation Year">
                  {/* <WDropDown
                    options={[
                      { name: "OPt1", value: 1 },
                      { name: "OPt2", value: 2 },
                    ]}
                    optionLabel="name"
                  /> */}
                  <WInputText />
                </TemplateInputContainer>
              </WFormControl>
            </div>
            </WFormGroup>

            <WFormGroup name="postgraduate">
            <div className="p-md-2">
              <WFormControl name="institution">
                <TemplateInputContainer label="University Name">
                  <WInputText />
                </TemplateInputContainer>
              </WFormControl>
            {/* </div>
            <div className="p-md-2"> */}
              <WFormControl name="graduationYear">
                <TemplateInputContainer label="Graduation Year">
                  {/* <WDropDown
                    options={[
                      { name: "OPt1", value: 1 },
                      { name: "OPt2", value: 2 },
                    ]}
                    optionLabel="name"
                  /> */}
                  <WInputText />
                </TemplateInputContainer>
              </WFormControl>
            </div>
            </WFormGroup>




            {/* <div className="p-md-2">
              <WFormControl name="institution">
                <TemplateInputContainer label="University Name">
                  <WInputText />
                </TemplateInputContainer>
              </WFormControl>
            {/* </div>
            <div className="p-md-2"> */}
              {/* <WFormControl name="graduationYear">
                <TemplateInputContainer label="Graduation Year"> */}
                  {/* <WDropDown
                    options={[
                      { name: "OPt1", value: 1 },
                      { name: "OPt2", value: 2 },
                    ]}
                    optionLabel="name"
                  /> */}
                  {/* <WInputText />
                </TemplateInputContainer>
              </WFormControl>
            </div> */} 
          </WFormGroup>
        </div>
        <SaveButton  label="GUARDAR DOCUMENTO" />
      </WForm>
    </>
  );
};
