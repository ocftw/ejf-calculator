const currentYear = new Date().getFullYear();

const contributionRate = 0.06;  // 提撥率 6%
const salaryGrowthRate = 0.02;  // 假設每年固定調薪 2%
const expectedReturnRate = 0.06;  // 假設年化報酬率 6%

const fundList = [
    {
        name: '新制勞退',
        id: 'labor',
        color: '#FFB300'
    },
    {
        name: '舊制勞退',
        id: 'legacy',
        color: '#3AB56C'
    },
    {
        name: '勞保基金',
        id: 'insurance',
        color: '#F8897F'
    },
    {
        name: '退撫基金',
        id: 'retire',
        color: '#6B98E0'
    }
]
const fundIds = fundList.map(fund => fund.id);

const calcAll = {};
fundList.forEach(fund => {
    calcAll[fund.id] = {};
});

let cvar = {};  // 氣候變遷影響因子
// 新制勞退
cvar['labor'] = {
    '2025': 0.08,
    '2026': 0.19,
    '2027': 0.29,
    '2028': 0.39,
    '2029': 0.49,
    '2030': 0.60,
    '2031': 0.72,
    '2032': 0.84,
    '2033': 0.97,
    '2034': 1.09,
    '2035': 1.21,
    '2036': 1.36,
    '2037': 1.50,
    '2038': 1.65,
    '2039': 1.79,
    '2040': 1.93,
    '2041': 2.18,
    '2042': 2.42,
    '2043': 2.67,
    '2044': 2.91,
    '2045': 3.15,
    '2046': 3.62,
    '2047': 4.08,
    '2048': 4.55,
    '2049': 5.01,
    '2050': 5.48
}
// 舊制勞退
cvar['legacy'] = {
    '2025': 0.11,
    '2026': 0.24,
    '2027': 0.37,
    '2028': 0.51,
    '2029': 0.64,
    '2030': 0.77,
    '2031': 0.93,
    '2032': 1.09,
    '2033': 1.25,
    '2034': 1.41,
    '2035': 1.57,
    '2036': 1.76,
    '2037': 1.94,
    '2038': 2.13,
    '2039': 2.31,
    '2040': 2.50,
    '2041': 2.82,
    '2042': 3.13,
    '2043': 3.45,
    '2044': 3.76,
    '2045': 4.08,
    '2046': 4.68,
    '2047': 5.28,
    '2048': 5.88,
    '2049': 6.48,
    '2050': 7.08
}
// 勞保
cvar['insurance'] = {
    '2025': 0.09,
    '2026': 0.19,
    '2027': 0.30,
    '2028': 0.40,
    '2029': 0.51,
    '2030': 0.61,
    '2031': 0.74,
    '2032': 0.86,
    '2033': 0.99,
    '2034': 1.12,
    '2035': 1.24,
    '2036': 1.39,
    '2037': 1.54,
    '2038': 1.68,
    '2039': 1.83,
    '2040': 1.98,
    '2041': 2.23,
    '2042': 2.48,
    '2043': 2.73,
    '2044': 2.98,
    '2045': 3.23,
    '2046': 3.70,
    '2047': 4.17,
    '2048': 4.65,
    '2049': 5.12,
    '2050': 5.60
}
// 退撫
cvar['retire'] = {
    '2025': 0.10,
    '2026': 0.21,
    '2027': 0.33,
    '2028': 0.45,
    '2029': 0.57,
    '2030': 0.69,
    '2031': 0.83,
    '2032': 0.97,
    '2033': 1.11,
    '2034': 1.25,
    '2035': 1.39,
    '2036': 1.56,
    '2037': 1.72,
    '2038': 1.89,
    '2039': 2.05,
    '2040': 2.22,
    '2041': 2.50,
    '2042': 2.78,
    '2043': 3.06,
    '2044': 3.34,
    '2045': 3.62,
    '2046': 4.15,
    '2047': 4.69,
    '2048': 5.22,
    '2049': 5.75,
    '2050': 6.29
}
// cvar 單位是 %，所以需要除以 100
Object.keys(cvar).forEach(key => {
    for (let year in cvar[key]) {
        cvar[key][year] /= 100;
    }
});

// 頁面模式檢測
function getQueryParam(name, def = '') {
    const url = new URL(window.location.href);
    return url.searchParams.get(name) || def;
}

// 檢測是否為 receipt 模式（透過 body 的 data-mode 屬性）
const isReceiptMode = document.body.getAttribute('data-mode') === 'receipt';
// console.log('isReceiptMode', isReceiptMode);

const CHART_STYLE = {
    gridBorder: {
        color: '#98A0AE',
        borderDash: [5, 5],
        lineWidth: 0.5
    },
    axisBorder: {
        color: '#98A0AE',
        width: 1
    },
    dataLine: {
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBorderWidth: 0
    }
};

let chartInstance = null;

function trackEvent(eventName, properties = {}) {
    if (!window.mixpanel) return;
    mixpanel.track(eventName, {
        ...properties,
        // timestamp: new Date().toISOString()
    });
    console.log('Mixpanel event:', eventName, properties);
}

if (window.Vue) {
const app = Vue.createApp({
    data() {
        return {
            userName: isReceiptMode ? getQueryParam('name') : '',
            monthlyIncome: Number(getQueryParam('income', 25250)),
            age: Number(getQueryParam('age', 20)),
            monthlyIncomeError: false,
            ageError: false,
            currentDateTime: isReceiptMode ? getQueryParam('current') || '' : '',
            funds: getQueryParam('funds', 'labor').split(',').filter(f => f),  // 預設勞退基金，支援複選

            fundName: '',
            totalInvestment: 0,
            expectedReturn: 0,
            expectedMinus: 0,
            decreaseRatio: isReceiptMode ? Number(getQueryParam('decreaseRatio', 40)) : 0,
            donut_strokeDasharray: '60 40', // 預設 40% 減損計算
            donut_transform: 'rotate(54 21 21)',
            activeMail: '',
            isCopied: false,
            isReceiptMode: isReceiptMode
        }
    },
    created() {
        if (!this.currentDateTime || !(/^\d{4}-\d{2}-\d{2}$/.test(this.currentDateTime)))
            this.currentDateTime = new Date().toISOString().split('T')[0];
    },
    mounted() {
        if (!isReceiptMode) this.initChart();

        this.$nextTick(() => {
            if (isReceiptMode)
                this.calculateDonutChart();
            else
                this.calculate();
        });
    },
    methods: {
        copyMailContent(type) {
            let contentSelector = `.mail-content-template[data-fund="${type}"]`;

            const contentDiv = document.querySelector(contentSelector);
            if (!contentDiv) {
                console.error('找不到內容區域:', contentSelector);
                return;
            }

            let textContent = contentDiv.innerText || '';
            console.log('textContent', textContent);

            navigator.clipboard.writeText(textContent).then(() => {
                console.log('=== 內容已複製到剪貼簿 ===');
                this.isCopied = true;
                setTimeout(() => { this.isCopied = false; }, 1000);
            })
            .catch(err => {
                console.error('=== 複製失敗:', err);
                alert('複製失敗，請手動選取文字');
            });

            trackEvent('Click Mail', { Section: type });
        },

        selectAllContent(event) {
            const contentDiv = event.currentTarget;
            const range = document.createRange();
            const selection = window.getSelection();

            range.selectNodeContents(contentDiv);
            selection.removeAllRanges();
            selection.addRange(range);
        },

        formatDateTime(date) {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const months = [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ];
            const day = days[date.getDay()];
            const month = months[date.getMonth()];
            const dayNum = date.getDate();
            const year = date.getFullYear();
            const hour = String(date.getHours()).padStart(2, '0');
            const min = String(date.getMinutes()).padStart(2, '0');
            const sec = String(date.getSeconds()).padStart(2, '0');
            return `${day}, ${month} ${dayNum}, ${year} · ${hour}:${min}:${sec}`;
        },
        formatNumber(num) {
            return new Intl.NumberFormat('zh-TW').format(num);
        },
        manualCalculate() {
            this.calculate();
            const chartColumn = document.querySelector('#result-column');
            if (chartColumn) chartColumn.scrollIntoView({ behavior: 'smooth' });
            trackEvent('Click Calculate', { age: this.age });
        },
        calculate() {
            console.log('=== 開始計算 ===');

            // 輸入驗證
            // FIXME: error 時的輸入元件樣式
            (function() {
            if (!this.monthlyIncome || this.monthlyIncome <= 0)
                this.monthlyIncomeError = true;
            else
                this.monthlyIncomeError = false;

            if (!this.age || this.age < 18 || this.age > 65)
                this.ageError = true;
            else
                this.ageError = false;
            })();
            if (this.monthlyIncomeError || this.ageError)
                return;

            // 如果 2050 年前滿 65 退休，退休後不再有本金投入
            const workYears = 65 - this.age;
            const yearRetire = workYears + currentYear;

            // 計算從 2025 到 2050 年的年薪、提撥金額、預期報酬、實際報酬
            fundList.forEach(fund => {
            let calc = calcAll[fund.id];
            console.log('fund', fund.id);

            for (let year = currentYear; year <= 2050; year++) {
                const yearlySalary = (year !== currentYear) ? Math.floor(calc[year - 1].yearlySalary * (1 + salaryGrowthRate)) : this.monthlyIncome * 12;
                const contribution = (year <= yearRetire) ? Math.floor(yearlySalary * contributionRate) : 0;
                const totalInvestment = (year !== currentYear) ? calc[year - 1].totalInvestment + contribution : contribution;
                const expectedReturn = (year !== currentYear) ? Math.floor((calc[year - 1].expectedReturn + contribution) * (1 + expectedReturnRate)) : Math.floor(contribution * (1 + expectedReturnRate));
                const cvarRate = Number((1 + expectedReturnRate - cvar[fund.id][year]).toFixed(4));
                const totalReturn = (year !== currentYear) ? Math.floor((calc[year - 1].totalReturn + contribution) * cvarRate) : Math.floor(contribution * cvarRate);

                calc[year] = {
                    'yearlySalary': yearlySalary,
                    'contribution': contribution,
                    'totalInvestment': totalInvestment,
                    'expectedReturn': expectedReturn,
                    'totalReturn': totalReturn
                };

                console.log('year', year, 'age', this.age + (year-currentYear), 'yearlySalary', yearlySalary, 'contribution', contribution, 'totalInvestment', totalInvestment, 'expectedReturn', expectedReturn, 'totalReturn', totalReturn);
            }
            });
            console.log('calcAll table', calcAll);

            let calc = calcAll[this.funds[0]];
            this.totalInvestment = calc[2050].totalInvestment;
            this.expectedReturn = calc[2050].expectedReturn;

            // 計算 2050 時的減損與減損比例
            fundList.forEach(fund => {
                this['totalInvestment_'+fund.id] = calcAll[fund.id][2050].totalInvestment;
                this['expectedReturn_'+fund.id] = calcAll[fund.id][2050].expectedReturn;
                this['totalReturn_'+fund.id] = calcAll[fund.id][2050].totalReturn;
                this['expectedMinus_'+fund.id] = calcAll[fund.id][2050].totalReturn - calcAll[fund.id][2050].expectedReturn;
                this['expectedMinusRatio_'+fund.id] = Math.round((this['expectedMinus_'+fund.id] / calcAll[fund.id][2050].expectedReturn) * 100);
            });

            /*
            console.log("=================== 2050 結果 ===================");

            console.log('總計投入金額:', this.totalInvestment);
            console.log('預期報酬:', this.expectedReturn);

            console.log("================================================");
            fundList.forEach(fund => {
                console.log(`${fund.name}`, calcAll[fund.id][2050]);

                console.log(`實際報酬:`, this['totalReturn_'+fund.id]);
                console.log(`減損:`, this['expectedMinus_'+fund.id]);
                console.log(`減損比例:`, this['expectedMinusRatio_'+fund.id]);
                console.log("================================================");
            });
            */

            this.currentDateTime = new Date().toISOString().split('T')[0];
            this.calculateDonutSection();

            if (isReceiptMode) return;

            this.updateChart();
            this.updateUrlParams();
            this.switchPageMail();
        },
        amountClass(val) {
            if (val > 0) return 'receipt-amount-positive';
            if (val < 0) return 'receipt-amount-negative';
            return '';
        },
        toggleFund(fundType) {
            const index = this.funds.indexOf(fundType);
            if (index > -1)
                this.funds.splice(index, 1);  // 如果已選中，則移除
            else
                this.funds.push(fundType);  // 如果未選中，則添加

            // 如果全部都關掉就切到下一個
            if (this.funds.length === 0) {
                let index = fundIds.indexOf(fundType) + 1;
                if (index >= fundIds.length) index = 0;
                this.funds.push(fundIds[index]);
            }

            // 根據 fundList[].id 排序
            this.funds.sort((a, b) => fundIds.indexOf(a) - fundIds.indexOf(b));

            if (this.totalInvestment > 0) {
                this.calculateDonutSection();
                this.updateChart();
                this.updateUrlParams();
                this.switchPageMail();
            }

            trackEvent('Switch Graph', { fund: fundType });
        },
        calculateDonutSection() {
            console.log('=== 更新圓餅圖區塊 ===');

            // 取第一個有打開的 funds
            const fundId = this.funds[0];
            this.fundName = fundList.find(fund => fund.id === fundId).name;
            this.expectedReturn = calcAll[fundId][2050].expectedReturn;
            this.expectedMinus = this[`expectedMinus_${fundId}`];
            this.decreaseRatio = -this[`expectedMinusRatio_${fundId}`];

            console.log('fundName', this.fundName);
            console.log('expectedReturn', this.expectedReturn);
            console.log('expectedMinus', this.expectedMinus);
            console.log('decreaseRatio', this.decreaseRatio);

            this.calculateDonutChart();
        },
        calculateDonutChart() {
            console.log('=== 更新圓餅圖 ===');

            this.donut_strokeDasharray = `${100 - this.decreaseRatio} ${this.decreaseRatio}`;
            this.donut_transform = `rotate(${Math.round(360 - (this.decreaseRatio/100 * 360) - 90)} 21 21)`;

            console.log('donut_strokeDasharray', this.donut_strokeDasharray);
            console.log('donut_transform', this.donut_transform);
        },
        initChart() {
            console.log('Chart.js 版本:', Chart.version);

            const ctx = document.querySelector('#return-chart-canvas');
            if (!ctx) return;

            // 建立數據集配置的輔助函數
            const createDataset = (label, borderColor) => ({
                label: label,
                data: [],
                borderColor: borderColor,
                borderWidth: CHART_STYLE.dataLine.borderWidth,
                pointRadius: CHART_STYLE.dataLine.pointRadius,
                pointHoverRadius: CHART_STYLE.dataLine.pointHoverRadius,
                pointHoverBackgroundColor: borderColor,
                pointHoverBorderWidth: CHART_STYLE.dataLine.pointHoverBorderWidth
            });

            const chartConfig = {
                type: 'line',
                data: {
                    datasets: [ createDataset('預期報酬', '#98A0AE') ].concat(fundList.map(fund => createDataset(`${fund.name}報酬`, fund.color)))
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: '年度',
                                // color: '#98A0AE',
                                // align: 'end',

                            },
                            ticks: {
                                color: '#98A0AE'
                            },
                            grid: CHART_STYLE.gridBorder,
                            border: CHART_STYLE.axisBorder
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: '累計資產',
                                // color: '#FFFFFF',
                                // align: 'end'
                            },
                            ticks: {
                                color: '#98A0AE'
                            },
                            grid: CHART_STYLE.gridBorder,
                            border: CHART_STYLE.axisBorder,
                            min: 0,
                            max: 2500000
                        }
                    },
                    plugins: {
                        legend: {
                            // display: true,
                            // position: 'top',
                            // labels: {
                            //     color: '#98A0AE',
                            //     usePointStyle: true,
                            //     padding: 20
                            // }
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            titleColor: '#FFFFFF',
                            bodyColor: '#FFFFFF',
                            // borderColor: '#98A0AE',
                            // borderWidth: 1,
                            cornerRadius: 4,
                            displayColors: false,
                            callbacks: {
                                title: function(context) {
                                    const year = context[0].label;
                                    return `${year} 年`;
                                },
                                label: function(context) {
                                    const value = context.parsed.y;
                                    const datasetIndex = context.datasetIndex;
                                    // ['預期報酬', '新制勞退報酬', '舊制勞退報酬', '勞保基金報酬', '退撫基金報酬'];
                                    const labels = ['預期報酬'].concat(fundList.map(fund => `${fund.name}報酬`));

                                    return `${labels[datasetIndex]}: ${new Intl.NumberFormat('zh-TW').format(value)} 元`;
                                }
                            }
                        }
                    }
                }
            };

            chartInstance = new Chart(ctx, chartConfig);
        },
        updateChart() {
            console.log('=== 開始更新圖表 ===');

            if (!chartInstance) {
                console.error('圖表不存在，跳過更新');
                return;
            }

            const years = [];
            for (let i = currentYear; i <= 2050; i++) years.push(i);
            // console.log('年份陣列:', years);

            const expectedReturnData = years.map(year => {
                return calcAll['labor'][year].expectedReturn; // 使用任一基金的預期報酬，因為預期報酬與基金無關
            });
            // console.log('預期報酬數據:', expectedReturnData);

            chartInstance.data.labels = years;
            chartInstance.data.datasets[0].data = expectedReturnData;

            // 各基金實際報酬數據
            fundList.forEach((fund, index) => {
                chartInstance.data.datasets[index + 1].data = years.map(year => {
                    return calcAll[fund.id][year].totalReturn;
                });
            });

            // 根據選中的基金來決定顯示哪些數據集
            const selectedFunds = this.funds;
            console.log('選中的基金 selectedFunds:', JSON.stringify(selectedFunds));

            // 更新圖表數據集的可見性
            chartInstance.data.datasets.forEach((dataset, index) => {
                if (index === 0) {
                    dataset.hidden = false;  // 預期報酬永遠顯示
                    return;
                }

                    if (selectedFunds.includes(fundList[index - 1].id))
                        dataset.hidden = false;
                    else
                        dataset.hidden = true;
            });

            console.log('圖表數據更新完成');

            // 動態調整 Y 軸最大值（只考慮可見的數據集）
            const visibleData = chartInstance.data.datasets
                .filter((dataset) => !dataset.hidden)
                .map(dataset => dataset.data)
                .flat();

            const maxValue = Math.max(...visibleData);
            console.log('Y 軸最大值:', maxValue);

            if (maxValue > 0) {
                // 計算十萬的整數倍數作為最大值
                const hundredThousand = 100000;
                const newMax = Math.ceil(maxValue / hundredThousand) * hundredThousand;
                console.log('新的 Y 軸最大值:', newMax);
                chartInstance.options.scales.y.max = newMax;
            }

            chartInstance.update();

            console.log('=== 圖表更新完成 ===');
        },
        openLightbox(lightboxName) {
            lightbox.open(lightboxName);
        },
        updateUrlParams() {
            const url = new URL(window.location.origin + window.location.pathname);

            url.searchParams.set('income', this.monthlyIncome);
            url.searchParams.set('age', this.age);
            url.searchParams.set('funds', this.funds.join(','));

            const newUrl = url.toString();
            window.history.replaceState(null, '', newUrl);

            // FIXME: 這邊作動態的更新應該沒有用
            const canonical = document.querySelector('meta[name="canonical"]');
            canonical.setAttribute('content', newUrl);
            const ogUrl = document.querySelector('meta[property="og:url"]');
            ogUrl.setAttribute('content', newUrl);

            // 生成收據圖片 URL 並更新 og:image
            const imageUrl = this.generateReceiptImageUrl();
            console.log('收據圖片網址:', imageUrl);
            const ogImage = document.querySelector('meta[property="og:image"]');
            ogImage.setAttribute('content', imageUrl);
        },
        generateReceiptImageUrl() {
            const url = new URL('receipt.html', window.location.origin);
            url.searchParams.set('name', this.userName);
            url.searchParams.set('decreaseRatio', this.decreaseRatio);
            url.searchParams.set('current', this.currentDateTime);

            const receiptUrl = url.toString();
            const encodedReceiptUrl = encodeURIComponent(receiptUrl);
            const paramPart = encodedReceiptUrl.split('%3F')[1];

            // 生成 hotshot 圖片 URL
            console.log('receipt 網址', receiptUrl);
            return 'https://hotshot.anoni.net/shoot?path=/receipt%3F' + paramPart + '&selector=div[id=app]&vpw=336&vph=2100';
        },
        downloadImageDirectly() {
            console.log('=== 直接下載圖片 ===');
            const shootUrl = app.generateReceiptImageUrl();
            window.open(shootUrl, '_blank');
        },
        toggleMail(fundId) {
            this.activeMail = fundId;
            trackEvent('Toggle Mail', { fund: fundId });
        },
        switchPageMail() {
            console.log('=== 切換頁面郵件內容 ===');
            if (this.funds.includes('retire') && (!this.funds.includes('labor')) && (!this.funds.includes('legacy')))
                this.activeMail = 'retire';
            else
                this.activeMail = 'labor';
        }
    }
}).mount('#app');
}

// ===== Lightbox 管理物件 =====
const lightbox = {
    open(lightboxName) {
        console.log(`=== Lightbox.open (${lightboxName}) ===`);

        if (lightboxName === 'share') {
            // 更新分享連結的 href 屬性
            this.updateShareLinks();
            this.copyReceiptToLightbox();
        }

        const lightbox = document.getElementById('lightbox-' + lightboxName);
        if (lightbox) {
            lightbox.classList.add('show');
            trackEvent('Open Lightbox', { page: lightboxName });
        }
    },

    close(lightboxName) {
        console.log(`=== Lightbox.close (${lightboxName}) ===`);

        const lightbox = document.getElementById('lightbox-' + lightboxName);
        if (lightbox) {
            lightbox.classList.remove('show');
        }
    },

    // 更新分享連結
    updateShareLinks() {
        const shareUrl = window.location.href;
        const shareBtns = document.querySelectorAll('.share-btns > a');
        shareBtns.forEach(btn => {
            btn.href = btn.href.replace('${shareUrl}', encodeURIComponent(shareUrl));
        });
    },

    // 複製收據到 lightbox
    copyReceiptToLightbox() {
        const originalReceipt = document.querySelector('.receipt-box');
        const container = document.getElementById('lightbox-receipt-container');

        if (!originalReceipt || !container) {
            console.error('無法找到 receipt 元素');
            return;
        }

        container.innerHTML = '';
        const receiptClone = originalReceipt.cloneNode(true);

        container.appendChild(receiptClone);
    },

    // 下載圖片功能
    downloadImage() {
        console.log('=== 開始下載圖片 ===');
        trackEvent('Download Receipt', { progress: 'begin' });

        const shootUrl = app.generateReceiptImageUrl();
        console.log('收據圖片網址:', shootUrl);

        // 使用 fetch 獲取圖片數據
        fetch(shootUrl)
            .then(response => {
                if (!response.ok) {
                    trackEvent('Download Receipt', { progress: 'error' });
                    throw new Error('網路回應不正常');
                }
                return response.blob();
            })
            .then(blob => {
                const blobUrl = window.URL.createObjectURL(blob);

                const downloadLink = document.createElement('a');
                downloadLink.href = blobUrl;
                downloadLink.download = 'EJF四大基金氣候風險損益對帳單.png';
                downloadLink.style.display = 'none';

                document.body.appendChild(downloadLink);
                downloadLink.click();

                document.body.removeChild(downloadLink);
                window.URL.revokeObjectURL(blobUrl);

                trackEvent('Download Receipt', { progress: 'downloaded' });
                console.log('=== 下載圖片完成 ===');
            })
            .catch(error => {
                trackEvent('Download Receipt', { progress: 'fetch error' });
                console.error('下載圖片時發生錯誤:', error);
                window.open(shootUrl, '_blank');
            });
    }
};

// ===== 更新垂直裝飾線長度 =====
function updateDecorationHeight() {
    const titleDecoration = document.querySelector('.title-decoration');
    if (titleDecoration) {
                // 直接計算從裝飾線位置到 page-footer 下緣的距離
        const pageFooter = document.querySelector('#page-footer');
        let decorationHeight = window.innerHeight; // 預設值

        if (pageFooter) {
            const footerBottom = pageFooter.offsetTop + pageFooter.offsetHeight;
            const decorationTop = titleDecoration.offsetTop;
            decorationHeight = footerBottom - decorationTop;
        }

        titleDecoration.style.setProperty('--decoration-height', `${decorationHeight}px`);

        console.log('裝飾線高度更新:', {
            footerBottom: pageFooter?.offsetTop + pageFooter?.offsetHeight,
            decorationTop: titleDecoration.offsetTop,
            decorationHeight,
            windowHeight: window.innerHeight
        });
    }
}
// Debounce 函數：在 resize 結束後延遲執行
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 使用 debounce 包裝 updateDecorationHeight，延遲 150ms 執行
const debouncedUpdateDecorationHeight = debounce(updateDecorationHeight, 150);

window.addEventListener('load', updateDecorationHeight);
window.addEventListener('resize', debouncedUpdateDecorationHeight);


const glideOpt = {
    // type: 'slider',
    type: 'carousel',
    gap: 10,
    animationDuration: 1000,
    bound: true,

    perView: 3,
    breakpoints: {
        800: { perView: 2 },
        558: { perView: 1 }
    }
}
const glides = document.querySelectorAll(".infopack-content");
glides.forEach(glide => {
    new Glide(glide, Object.assign({
    }, glideOpt)).mount();
});
