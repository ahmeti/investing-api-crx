// noinspection JSUnresolvedReference,JSUnusedLocalSymbols

const App = {

    getAccessToken: () => {
        const data = JSON.parse(document.getElementById('__NEXT_DATA__').innerHTML);
        if (!data.props.pageProps.accessToken) {
            alert('Access token not found!');
            throw new Error('Access token not found!');
        }
        return data.props.pageProps.accessToken;
    },

    request: (params) => {
        return new Promise((resolve, reject) => {
            fetch(
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
                }).then((response) => {
                if (response.ok) {
                    return response.json();
                }
                return response.text().then(text => {throw new Error(text);});
            }).then(data => resolve(data)).catch(error => reject(error));
        });
    },

    post: (symbolName, options, body) => {
        return new Promise((resolve, reject) => {
            fetch(options.api_url + '?' + 'symbol_name=' + symbolName,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                }).then((response) => {
                if (response.ok) {
                    return response.json();
                }
                return response.text().then(text => {throw new Error(text);});
            }).then(data => resolve(data)).catch(error => reject(error));
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
                    chrome.runtime.sendMessage({ from: 'content', message: 'Investing Preparing: ' + request.action + ' -> ' + symbol.name });
                    const params = {
                        symbol_id: symbol.id,
                        date_min: options.date_min,
                        date_max: options.date_max,
                    };
                    App.request(params).then((dataInvesting) => {
                        chrome.runtime.sendMessage({ from: 'content', message: 'Investing Success: ' + request.action + ' -> ' + symbol.name });
                        App.post(symbol.name, options, dataInvesting).then((dataApi) => {
                            chrome.runtime.sendMessage({ from: 'content', message: 'Api Success: ' + request.action + ' -> ' + symbol.name });
                        }, (errorApi) => {
                            chrome.runtime.sendMessage({ from: 'content', message: 'Api Error: ' + request.action + ' -> ' + symbol.name + ' -> ' + errorApi });
                        });
                    }, (errorInvesting) => {
                        chrome.runtime.sendMessage(
                            { from: 'content', message: 'Investing Error: ' + request.action + ' -> ' + symbol.name + ' -> ' + errorInvesting });
                    });
                }, index * options.sleep_seconds);
            });
        });
    },
};

chrome.runtime.onMessage.addListener(App.onMessage);
