var _ = require("underscore"),
    VALID_USERNAME = /^[a-z\@\.\_\-\s\d]{3,}$/i,
    CPF = require("cpf_cnpj").CPF,
    CNPJ = require("cpf_cnpj").CNPJ;

module.exports = (controller) => {

    controller.registerCall("admin::changeCompany", (companyNode, username, section) => {
        var form = controller.call("form", (opts) => {

            opts.username = username;
            controller.serverCommunication.call("UPDATE 'BIPBOPCOMPANYS'.'COMPANY'",
                controller.call("error::ajax", controller.call("loader::ajax", {
                    data: opts,
                    success: (response) => {
                        controller.call("admin::viewCompany", $(response).find("BPQL > body > company"), section, "replaceWith");
                    }
                })));
        });
        form.configure({
            "title": "Alteração de Conta",
            "subtitle": "Preencha os dados abaixo.",
            "gamification": "magicWand",
            "paragraph": "É muito importante que os dados estejam preenchidos de maneira correta para que seja mantido um cadastro saneado.",
            "screens": [{
                "magicLabel": true,
                validate: (callback, configuration, screen, formManager) => {
                    formManager.defaultScreenValidation((isValid) => {
                        if (!isValid) {
                            callback(isValid);
                            return;
                        }

                        var values = formManager.readValues();
                        if (!values.cpf && !values.cnpj) {
                            toastr.error(
                                "É necessário ao menos um documento para emissão de documento fiscal.",
                                "Impossível continuar sem CPF ou CNPJ");
                            isValid = false;
                        }

                        if (values.cpf) {
                            if (!values.name) {
                                toastr.error(
                                    "É necessário que o nome seja preenchido caso haja CPF.",
                                    "Impossível continuar sem nome");
                                isValid = false;
                            }
                            if (!CPF.isValid(values.cpf)) {
                                toastr.error("O CPF inserido não confere, verifique e tente novamente.");
                                isValid = false;
                            }
                        }

                        if (values.cnpj) {
                            if (!values.company) {
                                toastr.error(
                                    "É necessário que o nome da empresa seja preenchido caso haja CNPJ.",
                                    "Impossível continuar sem nome da empresa");
                                isValid = false;
                            }
                            if (!CNPJ.isValid(values.cnpj)) {
                                toastr.error("O CNPJ inserido não confere, verifique e tente novamente.");
                                isValid = false;
                            }
                        }

                        callback(isValid);
                    }, configuration, screen);
                },
                "fields": [{
                        "name": "company",
                        "type": "text",
                        "placeholder": "Empresa",
                        "optional": true,
                        "labelText": "Empresa",
                        "value": $(companyNode).children("nome").text()
                    },
                    [{
                        "name": "username",
                        "type": "text",
                        "placeholder": "Usuário",
                        "optional": true,
                        "value": $(companyNode).children("username").text(),
                        "labelText": "Usuário",
                        validate: function(item) {
                            return VALID_USERNAME.test(item.element.val());
                        },
                        validateAsync: function(callback, item) {
                            controller.serverCommunication.call("SELECT FROM 'HARLANAUTHENTICATION'.'USERNAMETAKEN'",
                                controller.call("error::ajax", controller.call("loader::ajax", {
                                    data: {
                                        username: item.element.val()
                                    },
                                    success: function() {
                                        callback(true);
                                    },
                                    error: function() {
                                        callback(false);
                                    }
                                })));
                        }
                    }, {
                        "name": "name",
                        "type": "text",
                        "placeholder": "Nome do Responsável",
                        "optional": true,
                        "labelText": "Nome",
                        "value": $(companyNode).children("responsavel").text(),
                    }],
                    [{
                        "name": "cnpj",
                        "type": "text",
                        "placeholder": "CNPJ",
                        "labelText": "CNPJ",
                        "mask": "00.000.000/0000-00",
                        "value": $(companyNode).children("cnpj").text(),
                        "optional": true,
                        "maskOptions": {
                            "reverse": true
                        },
                        validate: function(item) {
                            if (item.element.val())
                                return CNPJ.isValid(item.element.val());
                        }
                    }, {
                        "name": "cpf",
                        "type": "text",
                        "placeholder": "CPF",
                        "labelText": "CPF",
                        "mask": "000.000.000-00",
                        "value": $(companyNode).children("cpf").text(),
                        "optional": true,
                        "maskOptions": {
                            "reverse": true
                        },
                        validate: function(item) {
                            if (item.element.val())
                                return CPF.isValid(item.element.val());
                        },
                    }]
                ],
                validate: (callback, configuration, screen, formManager) => {
                    formManager.defaultScreenValidation((isValid) => {
                        if (!isValid) {
                            callback(isValid);
                            return;
                        }

                        var values = formManager.readValues();
                        if (!values.cpf && !values.cnpj) {
                            toastr.error(
                                "É necessário ao menos um documento para emissão de documento fiscal.",
                                "Impossível continuar sem CPF ou CNPJ");
                            isValid = false;
                        }

                        if (values.cpf) {
                            if (!values.name) {
                                toastr.error(
                                    "É necessário que o nome seja preenchido caso haja CPF.",
                                    "Impossível continuar sem nome");
                                isValid = false;
                            }
                            if (!CPF.isValid(values.cpf)) {
                                toastr.error("O CPF inserido não confere, verifique e tente novamente.");
                                isValid = false;
                            }
                        }

                        if (values.cnpj) {
                            if (!values.company) {
                                toastr.error(
                                    "É necessário que o nome da empresa seja preenchido caso haja CNPJ.",
                                    "Impossível continuar sem nome da empresa");
                                isValid = false;
                            }
                            if (!CNPJ.isValid(values.cnpj)) {
                                toastr.error("O CNPJ inserido não confere, verifique e tente novamente.");
                                isValid = false;
                            }
                        }

                        callback(isValid);
                    }, configuration, screen);
                }
            }]
        });

    })

};