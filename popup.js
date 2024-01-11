// noinspection JSUnresolvedReference, JSIgnoredPromiseFromCall

const Popup = {

    run: () => {
        Popup.init();
        Popup.clickSymbolNewBtn();
        Popup.clickSymbolDelBtn();
        Popup.clickSaveBtn();
        Popup.clickRunBtn();
    },

    isValidUrl: (string) => {
        let url;
        try {
            url = new URL(string);
        } catch (_) {
            return false;
        }
        return url.protocol === 'http:' || url.protocol === 'https:';
    },

    isValidDate: (dateString) => {
        let regEx = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateString.match(regEx)) return false;  // Invalid format
        let d = new Date(dateString);
        let dNum = d.getTime();
        if (!dNum && dNum !== 0) return false; // NaN value, Invalid date
        return d.toISOString().slice(0, 10) === dateString;
    },

    init: () => {
        chrome.storage.local.get(['symbols']).then((result) => {
            if (!result.hasOwnProperty('symbols') || !Array.isArray(result.symbols)) {
                return Popup.updateSymbolTable();
            }
            const tbody = document.getElementById('symbol-table').querySelector('tbody');
            result.symbols.forEach((item) => {
                const template = document.createElement('tr');
                template.innerHTML =
                    '<td><button type="button" class="btn btn-danger btn-sm symbol-del-btn"><i class="fa-solid fa-trash"></i></button></td>' +
                    '<td><input type="number" name="symbol_id[]" value="' + item.id +
                    '" class="form-control form-control-sm" min="0" step="1" required placeholder="Investing symbol id"/></td>' +
                    '<td><input type="text" name="symbol_name[]" value="' + item.name +
                    '" class="form-control form-control-sm" required placeholder="Symbol name"/></td>';
                tbody.appendChild(template);
            });
        });

        chrome.storage.local.get(['options']).then((result) => {
            if (!result.hasOwnProperty('options')) {
                return;
            }
            const tbody = document.getElementById('options-table').querySelector('tbody');
            tbody.querySelector('input[name=\'api_url\']').value = result.options.api_url;
            tbody.querySelector('input[name=\'sleep_seconds\']').value = result.options.sleep_seconds;
            tbody.querySelector('input[name=\'date_min\']').value = result.options.date_min;
            tbody.querySelector('input[name=\'date_max\']').value = result.options.date_max;
        });
    },

    clickSymbolNewBtn: () => {
        document.getElementById('symbol-new-btn').addEventListener('click', () => {
            const tbody = document.getElementById('symbol-table').querySelector('tbody');
            const template = document.createElement('tr');
            template.innerHTML =
                '<td><button type="button" class="btn btn-danger btn-sm symbol-del-btn"><i class="fa-solid fa-trash"></i></button></td>' +
                '<td><input type="number" name="symbol_id[]" class="form-control form-control-sm" min="0" step="1" required placeholder="Investing symbol id"/></td>' +
                '<td><input type="text" name="symbol_name[]" class="form-control form-control-sm" required placeholder="Symbol name"/></td>';
            tbody.appendChild(template);
            Popup.updateSymbolTable();
        });
    },

    clickSymbolDelBtn: () => {
        document.addEventListener('click', (e) => {
            if (e.target.closest('button.symbol-del-btn')) {
                e.target.closest('button.symbol-del-btn').closest('tr').remove();
                Popup.updateSymbolTable();
            }
        });
    },

    clickSaveBtn: () => {
        document.getElementById('save-btn').addEventListener('click', () => {
            const symbolsform = document.getElementById('symbol-table').closest('form');
            const symbolIds = [...symbolsform.querySelectorAll('input[name=\'symbol_id[]\']')];
            const symbolNames = [...symbolsform.querySelectorAll('input[name=\'symbol_name[]\']')];

            const optionsTable = document.getElementById('options-table');
            const options = {
                api_url: optionsTable.querySelector('input[name=\'api_url\']').value,
                sleep_seconds: Number(optionsTable.querySelector('input[name=\'sleep_seconds\']').value),
                date_min: optionsTable.querySelector('input[name=\'date_min\']').value,
                date_max: optionsTable.querySelector('input[name=\'date_max\']').value,
            };

            let errorMsg;
            let symbols = [];
            if (symbolIds.length > 0 && symbolNames.length > 0 && symbolIds.length === symbolNames.length) {
                symbolIds.forEach((symbolId, index) => {
                    const id = Number(symbolId.value);
                    const name = '' + symbolNames[index].value;

                    if (!Number.isInteger(id) || id < 1) {
                        errorMsg = 'Symbol id is not a number!';
                        alert(errorMsg);
                        throw new Error(errorMsg);
                    }

                    if (name.length < 1) {
                        errorMsg = 'Symbol name is invalid!';
                        alert(errorMsg);
                        throw new Error(errorMsg);
                    }

                    symbols.push({ id: id, name: name });
                });
            }

            if (symbols.length < 1) {
                symbols = null;
            }

            if (!Popup.isValidUrl(options.api_url)) {
                errorMsg = 'Api url is not valid!';
                alert(errorMsg);
                throw new Error(errorMsg);
            }

            if (!Number.isInteger(options.sleep_seconds) || options.sleep_seconds < 3) {
                errorMsg = 'Sleep seconds must be at least 3 seconds!';
                alert(errorMsg);
                throw new Error(errorMsg);
            }

            if (!Popup.isValidDate(options.date_min)) {
                errorMsg = 'Start date is not valid!';
                alert(errorMsg);
                throw new Error(errorMsg);
            }

            if (!Popup.isValidDate(options.date_max)) {
                errorMsg = 'End date is not valid!';
                alert(errorMsg);
                throw new Error(errorMsg);
            }

            chrome.storage.local.set({ symbols: symbols, options: options }).then(() => {
                alert('Symbols and options have been successfully saved.');
            });
        });
    },

    clickRunBtn: () => {
        document.getElementById('run-btn').addEventListener('click', (e) => {
            e.target.disabled = true;
            chrome.storage.local.get(['symbols']).then((result) => {
                if (result.hasOwnProperty('symbols') && Array.isArray(result.symbols)) {
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        chrome.tabs.sendMessage(tabs[0].id, { from: 'popup', action: 'run_historical' });
                    });
                } else {
                    e.target.disabled = false;
                }
            });
        });
    },

    updateSymbolTable: () => {
        const tbody = document.getElementById('symbol-table').querySelector('tbody');
        const rows = tbody.getElementsByTagName('tr');

        if (rows.length < 1) {
            const template = document.createElement('tr');
            template.id = 'symbol-table-alert-tr';
            template.innerHTML = '<td colspan="3"><div class="alert alert-danger mb-0 px-2 py-1" role="alert"><i class="fa-solid fa-triangle-exclamation"></i> Registered symbols not found.</div></td>';
            tbody.appendChild(template);
        } else if (rows.length > 1) {
            const alertTr = document.getElementById('symbol-table-alert-tr');
            if (alertTr) {
                alertTr.remove();
            }
        }
    },

    onMessage: (request, sender) => {
        if (request.from !== 'content') {
            return;
        }

        document.getElementById('log-textarea').value += request.message + '\n';
    },
};

document.addEventListener('DOMContentLoaded', () => Popup.run());

chrome.runtime.onMessage.addListener(Popup.onMessage);
