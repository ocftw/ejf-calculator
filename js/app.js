const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            userName: '',
            monthlyIncome: 0,
            age: 0,
            isGovernmentEmployee: '否',
            totalInvestment: 0, // 總計投入金額
            expectedReturn: 0,   // 預期報酬
            total: 0,            // total
            investmentDiff: 0,   // 與投入金額相比
            returnDiff: 0,  // 與預期報酬相比
            chart: null,
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
            // 1. 總計投入金額 = 月薪 x (60-年齡)
            this.totalInvestment = Math.floor(this.monthlyIncome * (60 - this.age));
            // 2. 預期報酬 = 總計投入金額 x1.5 減去總計投入金額
            this.expectedReturn = Math.floor(this.totalInvestment * 1.5 - this.totalInvestment);
            // 3. total = 總計投入金額 x1.5 x 各基金調整參數
            let total = this.totalInvestment * 1.5;
            Object.keys(this.funds).forEach(fundType => {
                if (this.funds[fundType]) {
                    total *= this.fundMultipliers[fundType];
                }
            });
            this.total = Math.floor(total);
            // 4. 與投入金額相比 = total - 總計投入金額
            this.investmentDiff = Math.floor(this.total - this.totalInvestment);
            // 5. 與預期報酬相比 = total - 總計投入金額 - 預期報酬
            this.returnDiff = Math.floor(this.total - this.totalInvestment - this.expectedReturn);
            // 時間
            this.currentDateTime = this.formatDateTime(new Date());
        },
        amountClass(val) {
            if (val > 0) return 'receipt-amount-positive';
            if (val < 0) return 'receipt-amount-negative';
            return '';
        },
        toggleFund(fundType) {
            this.funds[fundType] = !this.funds[fundType];
        }
    }
});

app.mount('#app');