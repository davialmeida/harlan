import changeCase from 'change-case';
import {
    CPF,
    CNPJ
} from 'cpf_cnpj';

module.exports = controller => {

    controller.registerCall('admin::remove::phone', (element, section, username, ddd, phone, pabx) =>
        element.addClass('can-remove').click(e => {
            e.preventDefault();
            controller.call('confirm', {
                title: 'Deseja realmente remover este telefone?'
            }, () => {
                controller.serverCommunication.call('DELETE FROM \'BIPBOPCOMPANYS\'.\'PHONE\'', {
                    data: {
                        username,
                        ddd,
                        phone,
                        pabx
                    },
                    success: response => {
                        controller.call('admin::viewCompany', $(response).find('BPQL > body > company'), section, 'replaceWith');
                    }
                });
            });
        }));

    controller.registerCall('admin::remove::email', (element, section, username, email) =>
        element.addClass('can-remove').click(e => {
            e.preventDefault();
            controller.call('confirm', {
                title: 'Deseja realmente remover este email?'
            }, () => {
                controller.serverCommunication.call('DELETE FROM \'BIPBOPCOMPANYS\'.\'EMAIL\'', {
                    data: {
                        username,
                        email
                    },
                    success: response => {
                        controller.call('admin::viewCompany', $(response).find('BPQL > body > company'), section, 'replaceWith');
                    }
                });
            });
        }));

    controller.registerCall('admin::tags::view', (data, username) => {
        if (!data || !data.length) {
            controller.call('admin::tag::create', username);
            return;
        }

        let modal = controller.call('modal');
        modal.title('Editar Tags');
        modal.subtitle(`Tags alteram o comportamento do sistema para o usuário ${username}.`);
        modal.paragraph('Antes de remover ou adicionar uma tag se certifique do comportamento que impactará no sistema.');
        let form = modal.createForm();
        let list = form.createList();

        for (let nodeValue of data) {
            let item = list.item('fa fa-tag', nodeValue);
            item.click(e => {
                e.preventDefault();
                controller.confirm({
                    title: `Deseja remover a tag ${nodeValue}?`,
                    subtitle: `A tag ${nodeValue} será removida e o comportamento do sistema será alterado.`,
                    paragraph: 'Se certique de que deseja realmente remover a tag.'
                }, () => {
                    controller.server.call('DELETE FROM \'BIPBOPCOMPANYS\'.\'TAG\'',
                        controller.call('loader::ajax', controller.call('error::ajax', {
                            data: {
                                tag: nodeValue,
                                username
                            },
                            success: () => item.remove()
                        })));
                });
            });
        }

        let actions = modal.createActions();
        actions.add('Nova Tag').click(e => {
            e.preventDefault();
            controller.call('admin::tag::create', username);
            modal.close();
        });
        actions.cancel();
    });

    controller.registerCall('admin::tags', username => {
        controller.server.call('SELECT FROM \'BIPBOPCOMPANYS\'.\'TAGS\'',
            controller.call('error::ajax', controller.call('loader::ajax', {
                data: {
                    username
                },
                dataType: 'json',
                success: data => controller.call('admin::tags::view', data, username)
            })));
    });

    controller.registerCall('admin::tag::create', username => {
        let modal = controller.call('modal');
        modal.title('Adicionar uma Tag');
        modal.subtitle(`Tags alteram o comportamento do sistema do usuário ${username}.`);
        modal.paragraph('Antes de remover ou adicionar uma tag se certifique do comportamento que impactará no sistema.');
        let form = modal.createForm();
        let tag = form.addInput('text', 'text', 'Tag');
        form.addSubmit('submit', 'Adicionar');
        let actions = modal.createActions();
        actions.cancel();
        form.element().submit(e => {
            e.preventDefault();
            controller.server.call('INSERT INTO \'BIPBOPCOMPANYS\'.\'TAG\'',
                controller.call('loader::ajax', controller.call('error::ajax', {
                    data: {
                        tag: tag.val(),
                        username
                    },
                    success: data => {
                        toastr.success(`A tag ${tag.val()} foi adicionada com sucesso.`,
                            'O comportamento do cliente foi alterado.');
                        modal.close();
                    }
                }))
            );
        });
    });

    controller.registerCall('admin::viewCompany', (companyNode, element, method, minimized) => {
        const company = $(companyNode);

        const name = company.children('nome').text();
        const username = company.children('username').text();
        const cnpj = company.children('cnpj').text();
        const cpf = company.children('cpf').text();
        const responsible = company.children('responsavel').text();
        const commercialReference = company.children('commercialReference').text();
        const credits = parseInt(company.children('credits').text());
        let postPaid = company.children('postPaid').text() == 'true';

        const [section, results, actions] = controller.call('section',
            `Administração ${name || username}`,
            `Conta registrada para documento ${(cnpj ? CNPJ.format(cnpj) : null) || (cpf ? CPF.format(cpf) : null) || username}`,
            'Visualizar, editar e controlar', false, minimized);

        section.addClass('admin-company');

        /* We live in citys we never seen in screen */
        const result = controller.call('result');

        if (name) result.addItem('Assinante', name);
        if (cnpj) result.addItem('CNPJ', CNPJ.format(cnpj));
        if (responsible) result.addItem('Responsável', responsible);
        if (cpf) result.addItem('CPF', CPF.format(cpf));
        const postPaidInput = result.addItem('Pós-pago', postPaid ? 'Sim' : 'Não');
        let creditsInput = null;
        if (credits) creditsInput = result.addItem('Créditos Sistema', numeral(credits / 1000.0).format('$0,0.00'));
        if (commercialReference) result.addItem('Referência Comercial', commercialReference);

        let apiKey;
        const inputApiKey = result.addItem('Chave de API', apiKey = company.children('apiKey').text());
        result.addItem('Usuário', username);
        const acceptedContract = result.addItem('Contrato Aceito', company.children('contractAccepted').text() == 'true' ? 'Aceito' : 'Não Aceito');

        let isActive = company.children('status').text() === '1';
        const activeLabel = result.addItem('Situação', isActive ? 'Ativo' : 'Bloqueado');

        if (!isActive) {
            section.addClass('inactive');
        }

        const phones = company.children('telefone').children('telefone');
        if (phones.length) {
            result.addSeparator('Telefones',
                'Lista de Telefones para Contato',
                'O telefone deve ser usado apenas para emergências e tratativas comerciais.');

            phones.each((idx, phoneNode) => {
                const $phoneNode = $(phoneNode);
                const [ddd, phone, pabx, contactName, kind] = [
                    $phoneNode.children('telefone:eq(0)').text(),
                    $phoneNode.children('telefone:eq(1)').text(),
                    $phoneNode.children('telefone:eq(2)').text(),
                    $phoneNode.children('telefone:eq(3)').text(),
                    $phoneNode.children('telefone:eq(4)').text()
                ];
                controller.call('admin::remove::phone', result.addItem(`${contactName} - ${kind}`, `(${ddd}) ${phone} ${pabx}`),
                    section, username, ddd, phone, pabx);
            });
        }

        const generateSeparator = (separatorCall) => {
            let separator = false;
            return (item, value) => {
                if (!value) {
                    return null;
                }

                if (!separator) {
                    separatorCall();
                    separator = true;
                }

                return result.addItem(item, value);
            };
        };

        const endereco = company.children('endereco');
        if (endereco.length) {
            const appendAddressItem = generateSeparator(() => {
                result.addSeparator('Endereço',
                    'Endereço registrado para emissão de faturas',
                    'As notas fiscais e faturas são enviadas para este endereço cadastrado, se certifique que esteja atualizado.');
            });

            appendAddressItem('Endereço', endereco.find('endereco:eq(0)').text());
            appendAddressItem('Número', endereco.find('endereco:eq(1)').text());
            appendAddressItem('Complemento', endereco.find('endereco:eq(2)').text());
            appendAddressItem('Bairro', endereco.find('endereco:eq(3)').text());
            appendAddressItem('Cidade', endereco.find('endereco:eq(4)').text());
            appendAddressItem('CEP', endereco.find('endereco:eq(5)').text());
            appendAddressItem('Estado', endereco.find('endereco:eq(6)').text());

        }
        const appendContractItem = generateSeparator(() => {
            result.addSeparator('Contrato',
                'Informações do Serviço Contratado',
                'Informações referentes ao contrato comercial estabelecido entre as partes.');
        });

        const contrato = company.children('contrato');
        const locale = numeral.locale();

        numeral.locale('en');
        const excedente = numeral(contrato.find('contrato:eq(3)').text() || '0');
        const valorContrato = numeral(contrato.find('contrato:eq(1)').text() || '0');
        numeral.locale(locale);

        appendContractItem('Dia Vencimento', contrato.find('contrato:eq(0)').text() || '1');
        appendContractItem('Valor', valorContrato.format('$0,0.00'));
        appendContractItem('Pacote de Consultas', contrato.find('contrato:eq(2)').text() || '0');
        appendContractItem('Valor da Consulta Excedente', excedente.format('$0,0.00'));

        appendContractItem('Tipo do Contrato', changeCase.titleCase(contrato.find('contrato:eq(4)').text()));
        appendContractItem('Criação', moment.unix(parseInt(contrato.find('contrato:eq(5)').text())).fromNow());

        const emails = company.children('email').children('email');
        if (emails.length) {
            result.addSeparator('Endereços de Email',
                'Endereços de e-mail registrados',
                'As notificações geradas pelo sistema são enviadas para estes e-mails.');

            emails.each((idx, value) => {
                const email = $('email:eq(0)', value).text();
                controller.call('admin::remove::email', result.addItem($('email:eq(1)', value).text(), email),
                    section, username, email);
            });
        }

        results.append(result.element());

        if (element !== false) {
            /* element can be undefined or null, false mean it will return only */
            (element || $('.app-content'))[method || 'append'](section);
            $('html, body').scrollTop(section.offset().top);
        }

        const lockSymbol = $('<i />').addClass('fa').addClass(isActive ? 'fa-unlock-alt' : 'fa-lock');
        const lockProcess = false;

        const doLocking = e => {
            e.preventDefault();
            if (lockProcess) {
                return;
            }
            controller.serverCommunication.call('UPDATE \'BIPBOPCOMPANYS\'.\'STATUS\'',
                controller.call('error::ajax', controller.call('loader::ajax', {
                    data: {
                        account: username,
                        set: !isActive ? 1 : 0,
                    },
                    success() {
                        isActive = !isActive;
                        activeLabel.find('.value').text(isActive ? 'Ativo' : 'Bloqueado');
                        section[isActive ? 'removeClass' : 'addClass']('inactive');
                        lockSymbol
                            .removeClass('fa-unlock-alt')
                            .removeClass('fa-lock')
                            .addClass(isActive ? 'fa-unlock-alt' : 'fa-lock');
                    }
                })));
        };

        const showInterval = setInterval(() => {
            if (!document.contains(actions.get(0)) || !$(actions).is(':visible')) {
                return;
            }

            clearInterval(showInterval);

            controller.trigger('admin::viewCompany', {
                actions,
                companyNode,
                username,
                section
            });

            controller.call('tooltip', actions, 'Esconder').append($('<i />').addClass('fa fa-eye-slash'))
                .click(controller.click('admin::changeHide', companyNode, username, section));

            controller.call('tooltip', actions, 'Editar').append($('<i />').addClass('fa fa-edit'))
                .click(controller.click('admin::changeCompany', companyNode, username, section));

            controller.call('tooltip', actions, 'Subcontas').append($('<i />').addClass('fa fa-users'))
                .click(controller.click('subaccount::list', companyNode, username, section));

            controller.call('tooltip', actions, 'Editar Contrato').append($('<i />').addClass('fa fa-briefcase'))
                .click(controller.click('admin::changeContract', companyNode, username, section));

            controller.call('tooltip', actions, 'Tags').append($('<i />').addClass('fa fa-tags'))
                .click(controller.click('admin::tags', username));

            controller.call('tooltip', actions, 'Abrir Conta').append($('<i />').addClass('fa fa-folder-open')).click(e => {
                e.preventDefault();
                window.open(`${document.location.protocol}\/\/${document.location.host}?apiKey=${encodeURIComponent(apiKey)}&support=1`);
            });

            controller.call('tooltip', actions, 'Editar Endereço').append($('<i />').addClass('fa fa-map'))
                .click(controller.click('admin::changeAddress', companyNode, username, section));

            controller.call('tooltip', actions, 'Dados Bancários').append($('<i />').addClass('fa fa-bank')).click(e => {
                controller.serverCommunication.call('SELECT FROM \'BIPBOPCOMPANYS\'.\'bankAccount\'', {
                    dataType: 'json',
                    data: {
                        username
                    },
                    success: data => {
                        controller.call('bankAccount::update', null, !data ? {} : data, 'UPDATE \'BIPBOPCOMPANYS\'.\'bankAccount\'', {
                            username
                        }, {
                            documento: cnpj ? CNPJ.format(cnpj) : CPF.format(cpf),
                            nome: name || responsible,
                            title: 'Dados Bancários',
                            subtitle: 'Preencha os dados bancários para depósito em conta.',
                            paragraph: 'É fundamental que o documento da conta para depósito seja o mesmo cadastrado em nosso sistema.'
                        });
                    }
                });
            });

            const generateInvoiceIcon = $.parseHTML(`<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="fill: #fff;width: 16px;" xml:space="preserve"> <g> <g> <path d="M192,176c-17.344,0-32-10.976-32-24s14.656-24,32-24c8.704,0,16.832,2.688,22.848,7.616 c6.848,5.568,16.896,4.512,22.528-2.304c5.568-6.848,4.544-16.928-2.304-22.528c-7.712-6.272-17.056-10.496-27.072-12.768V80 c0-8.832-7.168-16-16-16c-8.832,0-16,7.168-16,16v17.984c-27.52,6.272-48,28-48,54.016c0,30.88,28.704,56,64,56 c17.344,0,32,10.976,32,24s-14.656,24-32,24c-8.704,0-16.832-2.688-22.848-7.616c-6.88-5.6-16.928-4.544-22.496,2.304 c-5.6,6.848-4.576,16.928,2.272,22.528c7.712,6.272,17.056,10.496,27.072,12.8V304c0,8.832,7.168,16,16,16c8.832,0,16-7.168,16-16 v-17.984c27.52-6.272,48-28,48-54.016C256,201.12,227.296,176,192,176z"></path> </g> </g> <g> <g> <path d="M446.752,137.856c-0.8-1.952-1.984-3.712-3.456-5.184L315.328,4.704c-1.472-1.472-3.232-2.656-5.184-3.456 c-1.92-0.8-4-1.248-6.144-1.248H96C78.368,0,64,14.368,64,32v448c0,17.632,14.368,32,32,32h320c17.632,0,32-14.368,32-32V144 C448,141.856,447.552,139.776,446.752,137.856z M320,54.624L393.376,128H320V54.624z M416,496v-16H96V32h192v96 c0,17.632,14.368,32,32,32h96v320c0,0,0,0,0.032,0L416,496z"></path> </g> </g> <g> <g> <path d="M368,224h-64c-8.832,0-16,7.136-16,16s7.168,16,16,16h64c8.832,0,16-7.168,16-16C384,231.168,376.832,224,368,224z"></path> </g> </g> <g> <g> <path d="M368,288h-64c-8.832,0-16,7.136-16,16s7.168,16,16,16h64c8.832,0,16-7.168,16-16C384,295.168,376.832,288,368,288z"></path> </g> </g> <g> <g> <path d="M368,352H144c-8.832,0-16,7.136-16,16s7.168,16,16,16h224c8.832,0,16-7.168,16-16C384,359.168,376.832,352,368,352z"></path> </g> </g> <g> <g> <path d="M368,416H144c-8.832,0-16,7.136-16,16s7.168,16,16,16h224c8.832,0,16-7.168,16-16C384,423.168,376.832,416,368,416z"></path> </g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> </svg>`) ;
            controller.call('tooltip', actions, 'Emitir Fatura').append($(generateInvoiceIcon).css('width', '16px')).click(e => {
                const modal = controller.call('modal');
                const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

                modal.title('Emitir Fatura');
                modal.subtitle('Emissão de fatura para a empresa selecionada');

                const form = modal.createForm();
                const confirmarEmissaoFatura = form.addSubmit('confirmar-emissao-fatura', 'Confirmar Emissão de Fatura').css({ backgroundColor: '#00a900', fontWeight: 'bold', color: 'white' });

                modal.createActions().cancel();

                confirmarEmissaoFatura.on('click', (ev) => {
                    ev.preventDefault();
                    toastr.warning(`${username}: Gerando Fatura...`);
                    modal.close();

                    controller.server.call('SELECT FROM \'BIPBOPCOMPANYS\'.\'IssueInvoice\'', {
                        data: {
                            username
                        },
                        success() {
                            toastr.success(`${username}: Fatura Gerada com Sucesso!`);
                        },
                        error() {
                            toastr.error(`${username}: Ocorreu um erro ao gerar a fatura!`);
                        }
                    });
                });
            });

            controller.call('tooltip', actions, 'Revogar Contrato').append($('<i />').addClass('fa fa-hand-paper-o')).click(e => {
                controller.call('confirm', {}, () => {
                    controller.serverCommunication.call('DELETE FROM \'BIPBOPCOMPANYS\'.\'contractAccepted\'',
                        controller.call('error::ajax', controller.call('loader::ajax', {
                            data: {
                                username
                            },
                            success() {
                                acceptedContract.remove();
                            }
                        })));
                });
            });

            controller.call('tooltip', actions, 'Pós-pago').append($('<i />').addClass('fa fa-credit-card')).click(e => {
                controller.call('confirm', {}, () => {
                    controller.serverCommunication.call('UPDATE \'BIPBOPCOMPANYS\'.\'POSTPAID\'',
                        controller.call('error::ajax', controller.call('loader::ajax', {
                            data: {
                                username,
                                postPaid: postPaid ? 'false' : 'true'
                            },
                            success() {
                                postPaid = !postPaid;
                                postPaidInput.find('.value').text(postPaid ? 'Sim' : 'Não');
                            }
                        })));
                });
            });

            controller.call('tooltip', actions, 'Nova Chave API').append($('<i />').addClass('fa fa-key')).click(e => {
                controller.call('confirm', {}, () => {
                    controller.serverCommunication.call('UPDATE \'BIPBOPCOMPANYS\'.\'APIKEY\'',
                        controller.call('error::ajax', controller.call('loader::ajax', {
                            data: {
                                username
                            },
                            success(ret) {
                                inputApiKey.find('.value').text($('BPQL > body > apiKey', ret).text());
                            }
                        })));
                });
            });

            controller.call('tooltip', actions, 'Nova Senha').append($('<i />').addClass('fa fa-asterisk')).click(e => {
                e.preventDefault();
                controller.call('admin::changePassword', username);
            });

            controller.call('tooltip', actions, 'Bloquear/Desbloquear').append(lockSymbol).click(doLocking);

            controller.call('tooltip', actions, 'Enviar E-mail').append($('<i />').addClass('fa fa-envelope'))
                .click(controller.click('admin::message', [apiKey]));

            controller.call('tooltip', actions, 'Adicionar E-mail').append($('<i />').addClass('fa fa-at'))
                .click(controller.click('admin::email', username, section));

            controller.call('tooltip', actions, 'Alterar Créditos').append($('<i />').addClass('fa fa-money')).click(e => {
                e.preventDefault();
                let modal = controller.modal();
                modal.gamification('moneyBag');
                modal.title('Alterar Créditos');
                modal.subtitle('Alteração de Créditos do Usuário');
                modal.paragraph('Ao submeter o usuário terá de recarregar a página para verificar as mudanças em sua conta, oriente o usuário a recarregar a página.');

                let form = modal.createForm();
                const input = form.addInput('Créditos', 'text', 'Créditos (R$)')
                    .mask('#.##0,00', {
                        reverse: true
                    });

                if (credits) {
                    input.val(numeral(Math.abs(credits / 1000)).format('0,0.00'));
                }

                const invertCredits = form.addCheckbox('invert', 'Saldo Devedor', credits < 0);

                form.addSubmit('change-credits', 'Alterar Créditos');
                form.element().submit(e => {
                    e.preventDefault();
                    const ammount = Math.ceil(numeral(input.val()).value() * 1000) * (invertCredits[1].is(':checked') ? -1 : 1);
                    controller.server.call('UPDATE \'BIPBOPCOMPANYS\'.\'CREDITS\'',
                        controller.call('loader::ajax', controller.call('error::ajax', {
                            data: {
                                ammount,
                                username
                            },
                            success: () => {
                                if (creditsInput) {
                                    creditsInput.find('.value').text(numeral(ammount / 1000.0).format('$0,0.00'));
                                } else {
                                    creditsInput = result.addItem('Créditos Sistema', numeral(ammount / 1000.0).format('$0,0.00')).insertAfter(inputApiKey);
                                }
                                modal.close();
                            }
                        })), true);
                });
                modal.createActions().cancel();
            });

            controller.call('tooltip', actions, 'Adicionar Telefone').append($('<i />').addClass('fa fa-phone'))
                .click(controller.click('admin::phone', username, section));

            controller.call('tooltip', actions, 'Consumo').append($('<i />').addClass('fa fa-tasks')).click(e => {
                e.preventDefault();
                const unregister = $.bipbopLoader.register();
                controller.call('admin::report', report => {
                    report.gamification('lives');

                    $('html, body').animate({
                        scrollTop: report.element().offset().top
                    }, 2000);

                    unregister();
                }, results, username, undefined, undefined, undefined, 'after', true);
            });
        }, 200);

        return section;
    });
};
