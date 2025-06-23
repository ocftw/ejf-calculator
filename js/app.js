const CHART_STYLE = {
    gridBorder: {
        color: '#98A0AE',
        borderDash: [5, 5],
        lineWidth: 0.5
    },
    axisBorder: {
        color: 'white',
        width: 1
    }
};

let chartInstance = null;

const app = Vue.createApp({
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

            /*
            // 計算時暫不需要檢查是否有名字
            if (!this.userName.trim()) {
                alert('請輸入您的名字');
                return;
            }
            */

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

            const chartConfig = {
                type: 'line',
                data: {
                    labels: [0, 10, 20, 30],
                    datasets: [{
                        label: '預期報酬',
                        data: [0, 0, 0, 0], // 初始化為 0
                        borderColor: '#FFFFFF',
                        borderWidth: 1,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: '#FFFFFF',
                        pointHoverBorderColor: '#98A0AE',
                        pointHoverBorderWidth: 2
                    }]
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
                                    return `預期報酬: ${new Intl.NumberFormat('zh-TW').format(value)} 元`;
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
                console.log('圖表不存在，跳過更新');
                return;
            }

            console.log('圖表存在，開始計算數據');

            // 計算圖表數據 - 從目前年齡到60歲的預期報酬變化
            const totalYears = 60 - this.age;

            // 生成從0年到總投入年數的數據點
            const years = [];
            for (let i = 0; i <= totalYears; i++) {
                years.push(i);
            }

            console.log('年份陣列:', years);

            const expectedReturnData = years.map(year => {
                if (year === 0) return 0;
                // 計算到60歲時的預期報酬，然後按比例分配
                const ratio = year / totalYears;
                return Math.floor(this.expectedReturn * ratio);
            });
            console.log('預期報酬數據:', expectedReturnData);

            console.log('準備更新圖表數據...');
            // 更新圖表數據
            chartInstance.data.labels = years;
            chartInstance.data.datasets[0].data = expectedReturnData;
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
        }
    }
});

app.mount('#app');