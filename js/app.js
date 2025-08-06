const contributionRate = 0.06;  // 提撥率 6%
const salaryGrowthRate = 0.02;  // 假設每年固定調薪 2%
const expectedReturnRate = 0.06;  // 假設年化報酬率 6%

let cavr = {};  // 氣候變遷影響因子
// 新制勞退
cavr['labor'] = {
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
cavr['legacy'] = {
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
cavr['insurance'] = {
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
cavr['retire'] = {
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
// CaVR 單位是 %，所以需要除以 100
Object.keys(cavr).forEach(key => {
    for (let year in cavr[key]) {
        cavr[key][year] /= 100;
    }
});

// 頁面模式檢測
function getQueryParam(name, def = '') {
    const url = new URL(window.location.href);
    return url.searchParams.get(name) || def;
}

// 檢測是否為 receipt 模式（透過 body 的 data-mode 屬性）
const isReceiptMode = document.body.getAttribute('data-mode') === 'receipt';

const CHART_STYLE = {
    gridBorder: {
        color: '#98A0AE',
        borderDash: [5, 5],
        lineWidth: 0.5
    },
    axisBorder: {
        color: 'white',
        width: 1
    },
    dataLine: {
        borderWidth: 1,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointHoverBorderWidth: 2
    }
};

let chartInstance = null;

const app = Vue.createApp({
    data() {
        return {
            userName: isReceiptMode ? getQueryParam('userName') : '',
            monthlyIncome: Number(getQueryParam('income', 25250)),
            age: Number(getQueryParam('age', 20)),
            isGovernmentEmployee: getQueryParam('servant', 'no'),
            monthlyIncomeError: false,
            ageError: false,
            isGovernmentEmployeeError: false,
            totalInvestment: Number(getQueryParam('totalInvestment', 0)),
            expectedReturn: Number(getQueryParam('expectedReturn', 0)),
            totalReturn: 0,
            investmentDiff: 0,
            returnDiff: 0,
            currentDateTime: isReceiptMode ? getQueryParam('currentDateTime') || '' : '',
            funds: getQueryParam('funds', 'labor'), // FIXME: 先寫死預設勞退 labor
        }
    },
    created() {
        if (!this.currentDateTime || !(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(this.currentDateTime)))
            this.currentDateTime = new Date().toISOString();

        if (isReceiptMode) this.calculateReceiptMode();
    },
    computed: {
        formattedDateTime() {
            console.log('formattedDateTime this.currentDateTime', this.currentDateTime);
            if (!this.currentDateTime) return '';
            return this.formatDateTime(new Date(this.currentDateTime));
        }
    },
    mounted() {
        if (isReceiptMode) return;

        this.initChart();
        this.$nextTick(() => {
            this.calculate();
        });
    },
    methods: {
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
        calculate() {
            console.log('=== 開始計算 ===');

            // 輸入驗證
            (function() {
            if (!this.monthlyIncome || this.monthlyIncome <= 0)
                this.monthlyIncomeError = true;
            else
                this.monthlyIncomeError = false;

            if (!this.age || this.age < 18 || this.age >= 65)
                this.ageError = true;
            else
                this.ageError = false;

            if ((this.isGovernmentEmployee !== 'no' && this.isGovernmentEmployee !== 'yes'))
                this.isGovernmentEmployeeError = true;
            else
                this.isGovernmentEmployeeError = false;
            })();
            if (this.monthlyIncomeError || this.ageError || this.isGovernmentEmployeeError)
                return;

            const currentYear = new Date().getFullYear();
            // const workYears = 65 - this.age; //FIXME: 需假設65歲退休，退休後不再有本金投入
            const workYears = 2050 - currentYear + 1;  // 計算到 2050 年

            // 計算從 2025 到 2050 年的年薪、提撥金額、預期報酬、實際報酬
            const calc = {};
            for (let year = currentYear; year <= 2050; year++) {
                const yearlySalary = (year !== currentYear) ? Math.floor(calc[year - 1].yearlySalary * (1 + salaryGrowthRate)) : this.monthlyIncome * 12;
                const contribution = Math.floor(yearlySalary * contributionRate);
                const totalInvestment = (year !== currentYear) ? calc[year - 1].totalInvestment + contribution : contribution;
                const expectedReturn = (year !== currentYear) ? Math.floor((calc[year - 1].expectedReturn + contribution) * (1 + expectedReturnRate)) : Math.floor(contribution * (1 + expectedReturnRate));
                const cavrRate = Number((1 + expectedReturnRate - cavr[this.funds][year]).toFixed(4));
                const totalReturn = (year !== currentYear) ? Math.floor((calc[year - 1].totalReturn + contribution) * cavrRate) : Math.floor(contribution * cavrRate);

                calc[year] = {
                    'yearlySalary': yearlySalary,
                    'contribution': contribution,
                    'totalInvestment': totalInvestment,
                    'expectedReturn': expectedReturn,
                    'totalReturn': totalReturn
                };
            }
            console.log('calc table', calc);

            // 1. 總計投入金額 = 月薪 x 年資 蓻，假設每年調薪 2%，提撥年薪 6%
            this.totalInvestment = calc[2050].totalInvestment;
            console.log('總計投入金額:', this.totalInvestment);

            // 2. 預期報酬 = 假設年化報酬率 6%，從現在到 2050 年的複利效果
            this.totalReturn = calc[2050].totalReturn; // 實際報酬
            this.expectedReturn = calc[2050].expectedReturn; // 預期報酬
            console.log('預期報酬:', this.expectedReturn);
            console.log('實際報酬:', this.totalReturn);

            this.investmentDiff = Math.floor(this.totalReturn - this.totalInvestment);
            this.returnDiff = Math.floor(this.totalReturn - this.expectedReturn);
            console.log('與投入金額相比:', this.investmentDiff);
            console.log('與預期報酬相比:', this.returnDiff);

            this.currentDateTime = new Date().toISOString();

            console.log('準備更新圖表...');
            this.updateChart();

            console.log('=== 計算完成 ===');

            this.updateUrlParams();
        },
        calculateReceiptMode() {
            if (!this.totalInvestment || this.totalInvestment <= 0) return;
            if (!this.expectedReturn || this.expectedReturn < 0) return;

            console.error('FIXME: 收據模式尚未實作');
            // 使用共用方法計算 total 和差異
            // FIXME:
            // this.adjustTotal(this.totalInvestment + this.expectedReturn);
        },
        amountClass(val) {
            if (val > 0) return 'receipt-amount-positive';
            if (val < 0) return 'receipt-amount-negative';
            return '';
        },
        toggleFund(fundType) {
            this.funds[fundType] = !this.funds[fundType];

            // 如果有計算過數據，則重新計算
            if (this.totalInvestment > 0) {
                this.calculate();
            }
        },
        initChart() {
            console.log('Chart.js 版本:', Chart.version);

            const ctx = document.querySelector('#return-chart-canvas');
            if (!ctx) return;

            // 建立數據集配置的輔助函數
            const createDataset = (label, borderColor) => ({
                label: label,
                data: [0, 0, 0, 0], // 初始化為 0
                borderColor: borderColor,
                borderWidth: CHART_STYLE.dataLine.borderWidth,
                pointRadius: CHART_STYLE.dataLine.pointRadius,
                pointHoverRadius: CHART_STYLE.dataLine.pointHoverRadius,
                pointHoverBackgroundColor: borderColor,
                pointHoverBorderColor: '#98A0AE',
                pointHoverBorderWidth: CHART_STYLE.dataLine.pointHoverBorderWidth
            });

            const chartConfig = {
                type: 'line',
                data: {
                    labels: [0, 10, 20, 30],
                    datasets: [
                        createDataset('預期報酬', '#FFFFFF'),
                        createDataset('郵政儲金調整', '#3AB56C'),
                        createDataset('勞保基金調整', '#F8897F'),
                        createDataset('勞退基金調整', '#FFB300'),
                        createDataset('退撫基金調整', '#6B98E0'),
                        createDataset('總計報酬', '#FFFFFF')
                    ]
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
                                text: '投入時間（年）',
                                color: '#FFFFFF',
                                position: 'right',
                                rotation: 0
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
                                text: '預期報酬（TWD）',
                                color: '#FFFFFF',
                                position: 'right',
                                rotation: 90
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
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#FFFFFF',
                            bodyColor: '#FFFFFF',
                            borderColor: '#98A0AE',
                            borderWidth: 1,
                            cornerRadius: 4,
                            displayColors: false,
                            callbacks: {
                                title: function(context) {
                                    const year = context[0].label;
                                    const currentAge = this.chart.data.currentAge || 20;
                                    const targetAge = currentAge + parseInt(year);
                                    return `年齡 ${targetAge} 歲 (${year} 年後)`;
                                },
                                label: function(context) {
                                    const value = context.parsed.y;
                                    const datasetIndex = context.datasetIndex;

                                    if (datasetIndex === 0)
                                        return `預期報酬: ${new Intl.NumberFormat('zh-TW').format(value)} 元`;
                                    if (datasetIndex === 1)
                                        return `郵政儲金: ${new Intl.NumberFormat('zh-TW').format(value)} 元`;
                                    if (datasetIndex === 2)
                                        return `勞保基金: ${new Intl.NumberFormat('zh-TW').format(value)} 元`;
                                    if (datasetIndex === 3)
                                        return `勞退基金: ${new Intl.NumberFormat('zh-TW').format(value)} 元`;
                                    if (datasetIndex === 4)
                                        return `退撫基金: ${new Intl.NumberFormat('zh-TW').format(value)} 元`;
                                    if (datasetIndex === 5)
                                        return `總計報酬: ${new Intl.NumberFormat('zh-TW').format(value)} 元`;

                                    return `${new Intl.NumberFormat('zh-TW').format(value)} 元`;
                                }
                            }
                        }
                    }
                }
            };

            chartInstance = new Chart(ctx, chartConfig);
        },

        updateChart() {

            return;

            console.log('=== 開始更新圖表 ===');

            if (!chartInstance) {
                console.log('圖表不存在，跳過更新');
                return;
            }

            console.log('圖表存在，開始計算數據');

            // 計算圖表數據 - 從目前年齡到65歲的預期報酬變化
            const totalYears = 65 - this.age;

            // 生成從0年到總投入年數的數據點
            const years = [];
            for (let i = 0; i <= totalYears; i++) {
                years.push(i);
            }

            console.log('年份陣列:', years);

            const expectedReturnData = years.map(year => {
                if (year === 0) return 0;
                // 計算到65歲時的預期報酬，然後按比例分配
                const ratio = year / totalYears;
                return Math.floor(this.expectedReturn * ratio);
            });
            console.log('預期報酬數據:', expectedReturnData);

            // 計算郵政儲金調整後的數據
            const postalAdjustedData = years.map(year => {
                if (year === 0) return 0;
                // 計算到65歲時的預期報酬，然後按比例分配，再乘以郵政儲金調整係數
                const ratio = year / totalYears;
                return Math.floor(this.expectedReturn * ratio * this.fundMultipliers.postal);
            });
            console.log('郵政儲金調整數據:', postalAdjustedData);

            // 計算保險基金調整後的數據
            const insuranceAdjustedData = years.map(year => {
                if (year === 0) return 0;
                // 計算到65歲時的預期報酬，然後按比例分配，再乘以保險基金調整係數
                const ratio = year / totalYears;
                return Math.floor(this.expectedReturn * ratio * this.fundMultipliers.insurance);
            });
            console.log('保險基金調整數據:', insuranceAdjustedData);

            // 計算勞工基金調整後的數據
            const laborAdjustedData = years.map(year => {
                if (year === 0) return 0;
                // 計算到65歲時的預期報酬，然後按比例分配，再乘以勞工基金調整係數
                const ratio = year / totalYears;
                return Math.floor(this.expectedReturn * ratio * this.fundMultipliers.labor);
            });
            console.log('勞工基金調整數據:', laborAdjustedData);

            // 計算退休基金調整後的數據
            const retireAdjustedData = years.map(year => {
                if (year === 0) return 0;
                // 計算到65歲時的預期報酬，然後按比例分配，再乘以退休基金調整係數
                const ratio = year / totalYears;
                return Math.floor(this.expectedReturn * ratio * this.fundMultipliers.retire);
            });
            console.log('退休基金調整數據:', retireAdjustedData);

            // 計算總計調整後的數據（所有開啟基金的調整因子相乘）
            const totalAdjustedData = years.map(year => {
                if (year === 0) return 0;
                // 計算到65歲時的預期報酬，然後按比例分配
                const ratio = year / totalYears;
                let totalMultiplier = 1;

                // 計算所有開啟基金的調整因子相乘
                if (this.funds.postal) totalMultiplier *= this.fundMultipliers.postal;
                if (this.funds.insurance) totalMultiplier *= this.fundMultipliers.insurance;
                if (this.funds.labor) totalMultiplier *= this.fundMultipliers.labor;
                if (this.funds.retire) totalMultiplier *= this.fundMultipliers.retire;

                return Math.floor(this.expectedReturn * ratio * totalMultiplier);
            });
            console.log('總計調整數據:', totalAdjustedData);

            console.log('準備更新圖表數據...');
            // 更新圖表數據
            chartInstance.data.labels = years;
            chartInstance.data.datasets[0].data = expectedReturnData;
            chartInstance.data.datasets[1].data = postalAdjustedData;
            chartInstance.data.datasets[2].data = insuranceAdjustedData;
            chartInstance.data.datasets[3].data = laborAdjustedData;
            chartInstance.data.datasets[4].data = retireAdjustedData;
            chartInstance.data.datasets[5].data = totalAdjustedData;

            // 根據各基金狀態決定是否顯示對應線條
            chartInstance.data.datasets[1].hidden = !this.funds.postal;
            chartInstance.data.datasets[2].hidden = !this.funds.insurance;
            chartInstance.data.datasets[3].hidden = !this.funds.labor;
            chartInstance.data.datasets[4].hidden = !this.funds.retire;

            // 當有任何基金開啟時顯示total線
            const hasAnyFund = this.funds.postal || this.funds.insurance || this.funds.labor || this.funds.retire;
            chartInstance.data.datasets[5].hidden = !hasAnyFund;

            // 動態調整expected線的顏色
            if (hasAnyFund) {
                chartInstance.data.datasets[0].borderColor = '#98A0AE';
                chartInstance.data.datasets[0].pointHoverBackgroundColor = '#98A0AE';
            } else {
                chartInstance.data.datasets[0].borderColor = '#FFFFFF';
                chartInstance.data.datasets[0].pointHoverBackgroundColor = '#FFFFFF';
            }

            // 將目前年齡和總年數傳遞給圖表，供 tooltip 和標籤使用
            chartInstance.data.currentAge = this.age;
            chartInstance.data.totalYears = totalYears;
            console.log('圖表數據更新完成');

            // 動態調整 Y 軸最大值
            const maxValue = Math.max(...expectedReturnData);
            console.log('最大值:', maxValue);

            if (maxValue > 0) {
                // 計算十萬的整數倍數作為最大值
                const hundredThousand = 100000;
                const newMax = Math.ceil(maxValue / hundredThousand) * hundredThousand;
                console.log('新的 Y 軸最大值:', newMax);
                console.log('準備設定 Y 軸最大值...');
                chartInstance.options.scales.y.max = newMax;
                console.log('Y 軸最大值設定完成');
            }

            console.log('準備呼叫 chart.update()...');
            // 直接更新圖表，不使用 requestAnimationFrame
            chartInstance.update('none');
            console.log('chart.update() 完成');

            console.log('=== 圖表更新完成 ===');
        },

        // Vue 中的開啟分享 lightbox 方法
        openShareLightbox() {
            console.log('=== Vue openShareLightbox 被呼叫 ===');
            lightbox.openShareLightbox();
        },
        updateUrlParams() {
            const url = new URL(window.location.href);

            // 保留用戶輸入的參數
            url.searchParams.set('income', this.monthlyIncome);
            url.searchParams.set('age', this.age);
            url.searchParams.set('servant', this.isGovernmentEmployee);

            // 選取基金狀態
            url.searchParams.set('funds', this.funds);

            const newUrl = url.toString();
            window.history.replaceState(null, '', newUrl);

            const canonical = document.querySelector('meta[name="canonical"]');
            canonical.setAttribute('content', newUrl);
            const ogUrl = document.querySelector('meta[property="og:url"]');
            ogUrl.setAttribute('content', newUrl);

            // 生成收據圖片 URL 並更新 og:image
            const imageUrl = this.generateReceiptImageUrl();
            console.log('收據圖片網址:', imageUrl);

            // 更新 og:image
            const ogImage = document.querySelector('meta[property="og:image"]');
            ogImage.setAttribute('content', imageUrl);
        },
        generateReceiptImageUrl() {
            const url = new URL('receipt.html', window.location.origin);
            url.searchParams.set('userName', this.userName);
            url.searchParams.set('servant', this.isGovernmentEmployee);
            url.searchParams.set('totalInvestment', this.totalInvestment);
            url.searchParams.set('expectedReturn', this.expectedReturn);
            url.searchParams.set('currentDateTime', this.currentDateTime);
            url.searchParams.set('postal', this.funds.postal);
            url.searchParams.set('insurance', this.funds.insurance);
            url.searchParams.set('labor', this.funds.labor);
            url.searchParams.set('retire', this.funds.retire);

            const receiptUrl = url.toString();
            const encodedReceiptUrl = encodeURIComponent(receiptUrl);
            const paramPart = encodedReceiptUrl.split('%3F')[1];

            // 生成 hotshot 圖片 URL
            return 'https://hotshot.anoni.net/shoot?path=/ejf/receipt%3F' + paramPart + '&selector=div[id=app]&vpw=336&vph=2100';
        }
    }
}).mount('#app');

// ===== Lightbox 管理物件 =====
const lightbox = {
    // 開啟分享 lightbox
    openShareLightbox() {
        console.log('=== Lightbox openShareLightbox 被呼叫 ===');

        // 更新分享連結的 href 屬性
        this.updateShareLinks();
        this.copyReceiptToLightbox();

        // 顯示 lightbox
        const lightbox = document.getElementById('share-lightbox');
        if (lightbox) {
            lightbox.style.display = 'flex';
            document.body.style.overflow = 'hidden';
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

    // 關閉分享 lightbox
    closeShareLightbox() {
        console.log('closeShareLightbox 被呼叫');

        const lightbox = document.getElementById('share-lightbox');
        if (lightbox) {
            lightbox.style.display = 'none';
            document.body.style.overflow = '';
        }
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

        const shootUrl = app.generateReceiptImageUrl();
        console.log('收據圖片網址:', shootUrl);

        // 使用 fetch 獲取圖片數據
        fetch(shootUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('網路回應不正常');
                }
                return response.blob();
            })
            .then(blob => {
                const blobUrl = window.URL.createObjectURL(blob);

                const downloadLink = document.createElement('a');
                downloadLink.href = blobUrl;
                downloadLink.download = 'EJF四大基金投資報酬計算機收據.png';
                downloadLink.style.display = 'none';

                document.body.appendChild(downloadLink);
                downloadLink.click();

                document.body.removeChild(downloadLink);
                window.URL.revokeObjectURL(blobUrl);

                console.log('=== 下載圖片完成 ===');
            })
            .catch(error => {
                console.error('下載圖片時發生錯誤:', error);
                window.open(shootUrl, '_blank');
            });
    }
};