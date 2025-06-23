const { createApp } = Vue;

// 將 chartStyle 定義為全域常數，避免 Vue 響應式系統控制
const CHART_STYLE = Object.freeze({
    gridBorder: {
        color: '#98A0AE',
        borderDash: [5, 5],
        lineWidth: 0.5
    },
    axisBorder: {
        color: 'white',
        width: 1
    }
});

// 將 chart 實例存儲在 Vue 實例外部
let chartInstance = null;

const app = createApp({
    data() {
        return {
            userName: '',
            monthlyIncome: 25250,
            age: 20,
            isGovernmentEmployee: 'no',
            totalInvestment: 0, // 總計投入金額
            expectedReturn: 0,   // 預期報酬
            total: 0,            // total
            investmentDiff: 0,   // 與投入金額相比
            returnDiff: 0,  // 與預期報酬相比
            currentDateTime: '',
            // 基金狀態
            funds: {
                postal: false,
                insurance: false,
                labor: false,
                retire: false
            },
            // 基金調整參數
            fundMultipliers: {
                postal: 0.96,
                insurance: 0.95,
                labor: 0.93,
                retire: 0.94
            }
        }
    },
    created() {
        this.currentDateTime = this.formatDateTime(new Date());
    },
    computed: {
        hasActiveFunds() {
            return Object.values(this.funds).some(fund => fund === true);
        }
    },
    mounted() {
        this.initChart();
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
            // FIXME: show error style and message at calculator instead of using alert

            if (!this.userName.trim()) {
                alert('請輸入您的名字');
                return;
            }

            if (!this.monthlyIncome || this.monthlyIncome <= 0) {
                alert('請輸入有效的平均月薪');
                return;
            }

            if (!this.age || this.age < 18 || this.age >= 60) {
                alert('請輸入有效的年齡（18-59歲）');
                return;
            }

            console.log('輸入驗證通過');

            // 1. 總計投入金額 = 月薪 x (60-年齡)
            this.totalInvestment = Math.floor(this.monthlyIncome * (60 - this.age));
            console.log('總計投入金額:', this.totalInvestment);

            // 2. 預期報酬 = 總計投入金額 x1.5 減去總計投入金額
            this.expectedReturn = Math.floor(this.totalInvestment * 1.5 - this.totalInvestment);
            console.log('預期報酬:', this.expectedReturn);

            // 3. total = 總計投入金額 x1.5 x 各基金調整參數
            let total = this.totalInvestment * 1.5;
            Object.keys(this.funds).forEach(fundType => {
                if (this.funds[fundType]) {
                    total *= this.fundMultipliers[fundType];
                }
            });
            this.total = Math.floor(total);
            console.log('Total:', this.total);

            // 4. 與投入金額相比 = total - 總計投入金額
            this.investmentDiff = Math.floor(this.total - this.totalInvestment);
            console.log('與投入金額相比:', this.investmentDiff);

            // 5. 與預期報酬相比 = total - 總計投入金額 - 預期報酬
            this.returnDiff = Math.floor(this.total - this.totalInvestment - this.expectedReturn);
            console.log('與預期報酬相比:', this.returnDiff);

            // 時間
            this.currentDateTime = this.formatDateTime(new Date());
            console.log('時間更新完成');

            console.log('準備更新圖表...');
            // 更新圖表
            this.updateChart();
            console.log('=== 計算完成 ===');
        },
        amountClass(val) {
            if (val > 0) return 'receipt-amount-positive';
            if (val < 0) return 'receipt-amount-negative';
            return '';
        },
        toggleFund(fundType) {
            this.funds[fundType] = !this.funds[fundType];
        },
        initChart() {
            console.log('Chart.js 版本:', Chart.version);

            const ctx = document.querySelector('#return-chart-canvas');
            if (!ctx) return;

            // 創建獨立的配置物件，避免與 Vue 響應式系統衝突
            const chartConfig = {
                type: 'line',
                data: {
                    labels: [0, 10, 20, 30],
                    datasets: [{
                        label: '資產報酬',
                        data: [0, 0, 0, 0], // 初始化為 0
                        borderColor: '#FFFFFF',
                        borderWidth: 1,
                        pointRadius: 0
                    },
                    {
                        label: '投入金額',
                        data: [0, 0, 0, 0],
                        borderColor: '#98A0AE',
                        borderWidth: 1,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
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
                            border: CHART_STYLE.axisBorder,
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: '資產報酬（TWD）',
                                color: '#FFFFFF',
                                position: 'right',
                                rotation: 90
                            },
                            ticks: {
                                color: '#98A0AE',
                                callback: function(value) {
                                    return new Intl.NumberFormat('zh-TW').format(value);
                                }
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
                        }
                    }
                }
            };

            // 使用全域變數存儲 chart 實例
            chartInstance = new Chart(ctx, chartConfig);
        },

        updateChart() {
            console.log('=== 開始更新圖表 ===');

            if (!chartInstance) {
                console.log('圖表不存在，跳過更新');
                return;
            }

            console.log('圖表存在，開始計算數據');

            // 計算圖表數據
            const years = [0, 10, 20, 30];
            console.log('年份陣列:', years);

            const investmentData = years.map(year => {
                if (year === 0) return 0;
                return Math.floor(this.totalInvestment * (year / (60 - this.age)));
            });
            console.log('投入金額數據:', investmentData);

            const returnData = years.map(year => {
                if (year === 0) return 0;
                let total = this.totalInvestment * (year / (60 - this.age)) * 1.5;
                Object.keys(this.funds).forEach(fundType => {
                    if (this.funds[fundType]) {
                        total *= this.fundMultipliers[fundType];
                    }
                });
                return Math.floor(total);
            });
            console.log('報酬數據:', returnData);

            console.log('準備更新圖表數據...');
            // 更新圖表數據
            chartInstance.data.labels = years;
            chartInstance.data.datasets[0].data = returnData;
            chartInstance.data.datasets[1].data = investmentData;
            console.log('圖表數據更新完成');

            // 動態調整 Y 軸最大值
            const maxValue = Math.max(...returnData, ...investmentData);
            console.log('最大值:', maxValue);

            if (maxValue > 0) {
                const newMax = Math.ceil(maxValue * 1.2);
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
        }
    }
});

app.mount('#app');