// noinspection JSUnresolvedReference

const App = {

    getAccessToken: () => {
        const data = JSON.parse(document.getElementById('__NEXT_DATA__').innerHTML);
        if (!data.props.pageProps.accessToken) {
            alert('Access token not found!');
            throw new Error('Access token not found!');
        }
        return data.props.pageProps.accessToken;
    },

    request: async (params) => {
        return new Promise(async (resolve, reject) => {
            const response = await fetch(
                'https://api.investing.com/api/financialdata/historical/' + params.symbol_id +
                '?start-date=' + params.date_min + '&end-date=' + params.date_max +
                '&time-frame=Daily&add-missing-rows=false',
                {
                    'headers': {
                        'accept': 'application/json, text/plain, */*',
                        'accept-language': 'en,tr-TR;q=0.9,tr;q=0.8,en-US;q=0.7',
                        'authorization': 'Bearer ' + App.getAccessToken(),
                        'cache-control': 'no-cache',
                        'domain-id': 'tr',
                        'pragma': 'no-cache',
                        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"macOS"',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-site',
                    },
                    'referrer': 'https://tr.investing.com/',
                    'referrerPolicy': 'strict-origin-when-cross-origin',
                    'body': null,
                    'method': 'GET',
                    'mode': 'cors',
                    'credentials': 'include',
                });

            resolve(await response.json());
        });
    },

    onMessage: (request, sender) => {
        if (request.from !== 'popup') {
            return;
        }

        chrome.runtime.sendMessage({ from: 'content', message: 'Starting ' + request.action });

        chrome.storage.local.get(['symbols', 'options']).then((result) => {
            const symbols = result.symbols;
            const options = result.options;
            symbols.forEach((symbol, index) => {
                setTimeout(() => {
                    chrome.runtime.sendMessage({ from: 'content', message: 'Preparing: ' + request.action + ' -> ' + symbol.name });
                    const params = {
                        symbol_id: symbol.id,
                        date_min: options.date_min,
                        date_max: options.date_max,
                    };
                    App.request(params).then((data) => {
                        console.log(data);
                        chrome.runtime.sendMessage({ from: 'content', message: 'Result: ' + request.action + ' -> ' + symbol.name });
                    });
                }, index * options.sleep_seconds);
            });
        });
    },
};

chrome.runtime.onMessage.addListener(App.onMessage);
