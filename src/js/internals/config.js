import MobileDetect from 'mobile-detect';
const md = new MobileDetect(window.navigator.userAgent);

module.exports = {
    facebookCode: '124712768157561',
    isCordova: !!window.isCordova,
    isPhone: md.phone(),
    smartsupp: 'ec822e14065c4cd2e91e7b4b63632849edd76247',
    proshield: {
        hosts: [
            'proshield',
            'proshield.harlan.com.br'
        ]
    },
    kronoos: {
        hosts: [
            'kronoos',
            'painel.kronoos.com'
        ]
    },
    jane: {
        hosts: [
            'jane',
            'jane.bipbop.com.br'
        ]
    },
    icheques: {
        hosts: [
            'icheques',
            'painel.icheques.com.br'
        ]
    },
    instantSearchDelay: 500, /* ms */
    animatedShowTable: 300,
    hideAutocomplete: 300,
    iugu: {
        token: '44176a3c-50ec-4c45-b092-1d957813d22d'
    },
    oauthKey: 'AYY0iBNDo95aIcw--iWIqa71ZJs',
    checkoutUrl: 'https://irql.bipbop.com.br/api/checkout.html',
    googleAnalyticsId: 'UA-36688252-3', /* Universal Analytics */

    gcm: {
        apiKey : 'AIzaSyAwitAYDKWMC4WYfF4YW5pTVN_GS1yxa-8'
    },
    syncInterval: 300,
    container: 'body',
    isIframe: !!window.frameElement,
    isExtension: !!window.frameElement
};
