const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            userName: '',
            monthlyIncome: 0,
            age: 0,
            isGovernmentEmployee: '否',
            calculatedAmount: 0,
            totalReturn: 0,
            chart: null,
            currentDateTime: new Date().toLocaleString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
        }
    },
    methods: {
        formatNumber(num) {
            return new Intl.NumberFormat('zh-TW').format(num);
        },
        calculate() {
            // 這裡添加計算邏輯
            this.calculatedAmount = this.monthlyIncome * 12; // 簡單示例
            this.totalReturn = this.calculatedAmount * 1.1; // 簡單示例
        }
    }
});

app.mount('#app');