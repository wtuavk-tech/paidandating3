// 由于环境限制，我们在此文件中编写 Vue 2 + JS 代码
// 实际运行时，浏览器会将其作为 JS 模块执行

// --- 1. 数据 Mock 逻辑 (保持不变) ---
const generateMockData = () => {
  const services = ['家庭保洁日常', '深度家电清洗', '甲醛治理', '玻璃清洗', '管道疏通', '空调清洗', '开荒保洁', '收纳整理', '沙发清洗'];
  const warranties = ['质保3天', '质保7天', '质保30天', '质保90天', '无质保']; 
  const regions = ['北京市/朝阳区', '上海市/浦东新区', '深圳市/南山区', '杭州市/西湖区', '成都市/武侯区', '广州市/天河区', '武汉市/江汉区', '南京市/鼓楼区'];
  const sources = ['小程序', '电话', '美团', '转介绍', '抖音', '58同城'];
  const coefficients = [1.0, 1.1, 1.2, 1.3, 1.5];
  
  return Array.from({ length: 128 }).map((_, i) => {
    const id = i + 1;
    let status = '已完成';
    let returnReason = undefined;
    let errorDetail = undefined;

    if (i % 5 === 0) status = '待派单';
    else if (i % 15 === 1) status = '作废';
    else if (i % 15 === 2) { status = '已退回'; returnReason = '客户改期/联系不上'; }
    else if (i % 15 === 3) { status = '报错'; errorDetail = '现场与描述不符，需加价'; }

    let dispatchStatus = '正常';
    if (status === '待派单') {
        const r = Math.random();
        if (r > 0.6) dispatchStatus = '已超时';
        else if (r > 0.3) dispatchStatus = '催单';
    }

    const baseAddress = `${['阳光', '幸福', '金地', '万科', '恒大'][i % 5]}花园 ${i % 20 + 1}栋 ${i % 30 + 1}0${i % 4 + 1}室`;
    const addressDetail = ['(靠近东门门岗，需刷卡)', '(楼下有快递柜，电梯需梯控)', '(小区正在施工，请从北门进)', '(大堂右转第一部电梯)', '(物业处登记后进入)'][i % 5];
    const fullAddress = `${baseAddress} ${addressDetail}`;

    const baseDetails = [
        '客户备注：需带3米梯子，家里有大型犬请注意安全。另外需要重点清理厨房油烟机死角。', 
        '特殊要求：家里有孕妇，请使用无刺激性清洁剂。进门请穿鞋套，需要开具增值税发票。', 
        '时间要求：尽量上午10点前到达，下午客户要出门。需带大功率吸尘器，地毯灰尘较多。', 
        '刚装修完，全屋开荒保洁，玻璃窗户较多。注意不要弄脏墙面乳胶漆。', 
        '老客户，要求指派上次的李师傅。如果李师傅没空，请安排经验丰富的老师傅。'
    ][i % 5];
    
    const serviceItem = services[i % services.length];
    const isHighValue = serviceItem.includes('深度') || serviceItem.includes('甲醛') || serviceItem.includes('开荒');
    const marketPrice = isHighValue ? 300 + (i % 10) * 20 : 100 + (i % 5) * 10;
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + (i % 3));
    futureDate.setHours(8 + (i % 10), (i * 15) % 60);
    const expectedTime = `${(futureDate.getMonth()+1).toString().padStart(2,'0')}-${futureDate.getDate().toString().padStart(2,'0')} ${futureDate.getHours().toString().padStart(2,'0')}:${futureDate.getMinutes().toString().padStart(2,'0')}`;

    return {
      id,
      orderNo: `ORD-${String(id).padStart(6, '0')}`,
      workOrderNo: `WO-${9980 + id}`,
      expectedTime,
      mobile: `13${i % 9 + 1}****${String(1000 + i).slice(-4)}`,
      serviceItem: serviceItem,
      warranty: warranties[i % warranties.length],
      serviceRatio: (['3:7', '4:6', '2:8'][i % 3]),
      status,
      returnReason,
      errorDetail,
      region: regions[i % regions.length],
      address: fullAddress, 
      details: baseDetails, 
      recordTime: `10-27 08:${String(i % 60).padStart(2, '0')}`,
      source: sources[i % sources.length],
      totalAmount: 150 + (i % 20) * 20,
      cost: (150 + (i % 20) * 20) * (i % 2 === 0 ? 0.6 : 0.7),
      hasAdvancePayment: i % 7 === 0,
      depositAmount: i % 12 === 0 ? 50 : undefined,
      weightedCoefficient: coefficients[i % coefficients.length],
      regionPeople: Math.floor(Math.random() * 6),
      dispatchStatus,
      dispatchMethod: isHighValue ? '谈单' : '抢单',
      marketPrice,
      historyPriceLow: Math.floor(marketPrice * 0.8),
      historyPriceHigh: Math.floor(marketPrice * 1.2),
    };
  });
};

// --- 2. Vue 组件逻辑 ---

// 注册 ElementUI 和 VXE Table (假设全局变量已由 index.html 引入)
// @ts-ignore
const Vue = window.Vue;
// @ts-ignore
const VXETable = window.VXETable;

if (Vue && VXETable) {
  Vue.use(VXETable);
}

new Vue({
  el: '#app',
  data() {
    return {
      tableData: [], // 原始数据
      displayData: [], // 当前页数据
      loading: false,
      isExpanded: false, // 搜索栏展开状态
      isScrolling: false, // 控制跑马灯滚动
      
      // 分页 - 修改每页为10条
      page: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },

      // 统计数据
      stats: {
        record: { total: 128, error: 3, all: 135, afterSales: 5, refund: '450.5' },
        dispatch: { today: 42, past: 86, other: 12, self: 30, single: 8, none: 2 },
        perf: { rate: '98.5%', today: '12850.0', wechat: '5600.0', platform: '7250.0', offline: '0' }
      },

      // 搜索表单
      searchForm: {
        keyword: '',
        personType: 'order',
        otherType: 'status',
        otherValue: '',
        timeType: 'create',
        dateRange: []
      },

      // 弹窗状态
      modals: {
        chat: { visible: false, role: '', order: null, message: '' },
        complete: { visible: false, order: null, amount: 0 }
      },

      // 表格列配置 (用于 VXE-Table - 实际上模板覆盖了此配置，但保持一致性更新)
      columns: [
        { field: 'mobile', title: '手机号', width: 95, align: 'center', fixed: 'left' },
        { field: 'serviceItem', title: '项目/质保期', width: 95, align: 'center' },
        { field: 'status', title: '状态', width: 90, align: 'center' },
        { field: 'weightedCoefficient', title: '系数', width: 50, align: 'center' },
        { field: 'region', title: '地域', width: 100, align: 'center' },
        { field: 'address', title: '详细地址', minWidth: 200 },
        { field: 'details', title: '详情', minWidth: 260 },
        // ... 其他列配置
      ]
    };
  },
  created() {
    this.loadData();
  },
  mounted() {
    // 设置定时器，每隔1小时滚动一次
    setInterval(() => {
      this.isScrolling = true;
      // 动画持续时间为80秒，留出一点缓冲时间后重置状态
      setTimeout(() => {
        this.isScrolling = false;
      }, 81000); 
    }, 3600 * 1000); // 1小时 = 3600秒 * 1000毫秒
  },
  methods: {
    loadData() {
      this.loading = true;
      // 模拟 API 延迟
      setTimeout(() => {
        const rawData = generateMockData();
        // 排序逻辑：待派单优先，然后按紧急程度
        rawData.sort((a, b) => {
           const getScore = (o) => {
             if (o.status !== '待派单') return 0;
             if (o.dispatchStatus === '催单') return 3;
             if (o.dispatchStatus === '已超时') return 2;
             return 1;
           }
           return getScore(b) - getScore(a);
        });
        
        this.tableData = rawData;
        this.page.total = rawData.length;
        this.updateDisplayData();
        this.loading = false;
      }, 300);
    },
    updateDisplayData() {
      const start = (this.page.currentPage - 1) * this.page.pageSize;
      const end = start + this.page.pageSize;
      this.displayData = this.tableData.slice(start, end);
    },
    handleSizeChange(val) {
      this.page.pageSize = val;
      this.updateDisplayData();
    },
    handleCurrentChange(val) {
      this.page.currentPage = val;
      this.updateDisplayData();
    },
    
    // 交互方法
    toggleExpand() {
      this.isExpanded = !this.isExpanded;
    },
    openChat(role, order) {
      this.modals.chat = { visible: true, role, order, message: '' };
    },
    openComplete(order) {
      this.modals.complete = { visible: true, order, amount: order.totalAmount };
    },
    handleDispatch(row) {
      this.$message.success(`订单 ${row.orderNo} 派单成功`);
      // 更新状态
      const index = this.tableData.findIndex(item => item.id === row.id);
      if (index !== -1) {
        this.tableData[index].status = '已完成';
        this.tableData[index].dispatchStatus = '正常';
        this.updateDisplayData();
      }
    },
    handleAction(command, row) {
      if (command === '完单') {
        this.openComplete(row);
      } else {
        this.$message.info(`执行操作: ${command} (ID: ${row.id})`);
      }
    },
    // 样式辅助 - Alipay Style Status (Clean Text, minimal bg)
    getStatusClass(status) {
      const map = {
        '待派单': 'text-[#ff9c1e] bg-orange-50', // Alipay Orange
        '已完成': 'text-[#00b578] bg-green-50', // Alipay Green
        '已退回': 'text-[#ff574d] bg-red-50',   // Alipay Red
        '报错': 'text-[#ff574d] font-bold bg-red-50',
        '作废': 'text-[#999999] bg-gray-50'
      };
      return map[status] || 'text-[#666] bg-gray-50';
    },
    checkResource(row) {
      this.$alert(`查询资源: ${row.region}`, '资源查询', { confirmButtonText: '确定' });
    }
  },
  template: `
    <div class="h-screen flex flex-col p-3 font-sans text-sm bg-[#f5f5f5]">
      
      <!-- 1. Notification Bar (通知栏) -->
      <div class="flex items-center gap-3 mb-3 px-3 py-2 bg-white rounded-xl shadow-sm relative group shrink-0 h-[52px]">
        <div class="flex items-center justify-center gap-1.5 bg-[#1677ff] text-white px-3 h-[28px] rounded-lg shrink-0 z-10 shadow-sm ml-1">
          <span class="text-[12px] font-bold whitespace-nowrap leading-none tracking-wide">主要公告</span>
          <i class="el-icon-bell text-white font-bold"></i>
        </div>
        <div class="flex-1 overflow-hidden relative h-full flex items-center">
          <div :class="['whitespace-nowrap flex items-center gap-16 text-[13px] font-medium text-[#333333] cursor-default', isScrolling ? 'animate-scroll-once' : '']">
            <span class="flex items-center gap-2">
              <i class="el-icon-message-solid text-[#1677ff]"></i>
              <span>关于 2025 年度秋季职级晋升评审的通知：点击下方详情以阅读完整公告内容。</span>
            </span>
            <span class="flex items-center gap-2">
               <i class="el-icon-warning text-[#ff9c1e]"></i>
               <span>📢 系统升级通知：今晚 24:00 将进行系统维护。</span>
            </span>
            <span class="flex items-center gap-2">
               <i class="el-icon-s-flag text-[#ff574d]"></i>
               <span>🔥 10月业绩pk赛圆满结束，恭喜华东大区获得冠军！</span>
            </span>
          </div>
        </div>
        <div class="shrink-0 z-10 text-[#999999] text-[12px] font-medium px-2 select-none mr-1 bg-gray-50 rounded py-1">
          2025-11-19
        </div>
      </div>

      <!-- 2. Search Panel (搜索面板) -->
      <div class="shadow-sm mb-3 transition-all duration-300 ease-in-out relative overflow-hidden rounded-xl bg-white shrink-0">
        <div class="flex w-full transition-all duration-300" :style="{ height: isExpanded ? '210px' : '64px' }">
          <!-- Left Content -->
          <div :class="['transition-all duration-300 ease-in-out border-r border-[#f0f0f0] flex relative', isExpanded ? 'w-[66%] p-2' : 'w-[90%] px-4 py-2 flex-row items-center gap-6']">
             <!-- Collapsed State -->
             <div v-if="!isExpanded" class="flex items-center w-full h-full">
                <div class="flex items-center gap-3 shrink-0 mr-6">
                    <div class="w-9 h-9 rounded-full bg-[#1677ff] flex items-center justify-center text-white shadow-sm shadow-blue-200">
                        <i class="el-icon-s-data text-lg"></i>
                    </div>
                    <span class="text-[15px] font-bold text-[#333333]">数据概览</span>
                </div>
                <div class="flex items-center flex-1 justify-between gap-6 overflow-hidden h-full">
                    <div class="flex items-baseline gap-1.5"><span class="text-xs text-[#999999]">录单</span><span class="text-xl font-bold text-[#1677ff] font-sans">{{ stats.record.total }}</span></div>
                    <div class="flex items-baseline gap-1.5"><span class="text-xs text-[#999999]">今日派单</span><span class="text-xl font-bold text-[#333333] font-sans">{{ stats.dispatch.today }}</span></div>
                    <div class="flex items-baseline gap-1.5"><span class="text-xs text-[#999999]">今日业绩</span><span class="text-xl font-bold text-[#00b578] font-sans">{{ stats.perf.today }}</span></div>
                    <div class="flex items-baseline gap-1.5"><span class="text-xs text-[#999999]">收款率</span><span class="text-xl font-bold text-[#333333] font-sans">{{ stats.perf.rate }}</span></div>
                    <div class="flex items-baseline gap-1.5"><span class="text-xs text-[#999999]">退款</span><span class="text-xl font-bold text-[#ff574d] font-sans">{{ stats.record.refund }}</span></div>
                </div>
             </div>
             <!-- Expanded State -->
             <div v-else class="flex h-full w-full">
                <div class="w-[30px] flex flex-col justify-center shrink-0 border-r border-[#f0f0f0] mr-2 py-4 items-center">
                    <div class="flex flex-col items-center text-sm font-bold text-[#1677ff] leading-relaxed">
                        <span>数</span><span>据</span>
                    </div>
                </div>
                <div class="flex-1 flex flex-col justify-center space-y-2 pt-0"> 
                    <!-- Rows (using Alipay accent colors) -->
                    <div class="flex items-center gap-3 h-[50px]"> 
                        <div class="flex items-center gap-2 text-[#333] w-[80px] justify-end shrink-0"><div class="w-1.5 h-1.5 rounded-full bg-[#ff574d]"></div><span class="text-sm font-bold">订单</span></div>
                        <div class="flex items-center gap-3 flex-1 w-full">
                           <div class="flex flex-col items-center justify-center border border-[#eee] rounded-lg px-2 flex-1 bg-white hover:border-[#ff574d] transition-colors py-1 h-[46px]">
                              <span class="text-[11px] mb-0.5 text-[#999]">录单数</span>
                              <span class="font-sans font-bold text-[#333] text-[16px] leading-none">{{ stats.record.total }}</span>
                           </div>
                           <div class="flex flex-col items-center justify-center border border-[#eee] rounded-lg px-2 flex-1 bg-white hover:border-[#ff574d] transition-colors py-1 h-[46px]">
                              <span class="text-[11px] mb-0.5 text-[#999]">报错数</span>
                              <span class="font-sans font-bold text-[#ff574d] text-[16px] leading-none">{{ stats.record.error }}</span>
                           </div>
                           <div class="flex flex-col items-center justify-center border border-[#eee] rounded-lg px-2 flex-1 bg-white hover:border-[#ff574d] transition-colors py-1 h-[46px]">
                              <span class="text-[11px] mb-0.5 text-[#999]">退款额</span>
                              <span class="font-sans font-bold text-[#333] text-[16px] leading-none">{{ stats.record.refund }}</span>
                           </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 h-[50px]">
                        <div class="flex items-center gap-2 text-[#333] w-[80px] justify-end shrink-0"><div class="w-1.5 h-1.5 rounded-full bg-[#1677ff]"></div><span class="text-sm font-bold">派单</span></div>
                        <div class="flex items-center gap-3 flex-1 w-full">
                           <div class="flex flex-col items-center justify-center border border-[#eee] rounded-lg px-2 flex-1 bg-white hover:border-[#1677ff] transition-colors py-1 h-[46px]" v-for="(val, key) in stats.dispatch" :key="key">
                              <span class="text-[11px] mb-0.5 text-[#999]">{{ {'today':'今日','past':'往日','other':'他派','self':'自派','single':'单库','none':'未派'}[key] }}</span>
                              <span class="font-sans font-bold text-[#333] text-[16px] leading-none">{{ val }}</span>
                           </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 h-[50px]">
                        <div class="flex items-center gap-2 text-[#333] w-[80px] justify-end shrink-0"><div class="w-1.5 h-1.5 rounded-full bg-[#00b578]"></div><span class="text-sm font-bold">业绩</span></div>
                        <div class="flex items-center gap-3 flex-1 w-full">
                           <div class="flex flex-col items-center justify-center border border-[#eee] rounded-lg px-2 flex-1 bg-white hover:border-[#00b578] transition-colors py-1 h-[46px]" v-for="(val, key) in stats.perf" :key="key">
                              <span class="text-[11px] mb-0.5 text-[#999]">{{ {'rate':'收款率','today':'今日','wechat':'微信','platform':'平台','offline':'线下'}[key] }}</span>
                              <span :class="['font-sans font-bold text-[16px] leading-none', key === 'today' ? 'text-[#00b578]' : 'text-[#333]']">{{ val }}</span>
                           </div>
                        </div>
                    </div>
                </div>
             </div>
          </div>
          <!-- Right Action/Search -->
          <div 
            :class="['transition-all duration-300 ease-in-out relative', isExpanded ? 'w-[34%] p-3 bg-white' : 'w-[10%] hover:bg-gray-50 cursor-pointer flex items-center justify-center']"
            @click="!isExpanded && toggleExpand()"
          >
             <div v-if="!isExpanded" class="flex flex-col items-center justify-center gap-1 text-[#1677ff] w-full h-full">
                 <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mb-1">
                    <i class="el-icon-search text-lg"></i>
                 </div>
                 <span class="text-[10px] font-bold text-[#666]">高级筛选</span>
             </div>
             <div v-else class="h-full flex flex-col justify-between">
                 <div class="flex justify-between items-center mb-1">
                    <div class="flex items-center gap-2"><i class="el-icon-search text-[#1677ff]"></i><h3 class="text-sm font-bold text-[#333]">筛选</h3></div>
                    <button @click.stop="toggleExpand" class="text-[10px] text-[#999] hover:text-[#1677ff] flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-all">收起 <i class="el-icon-arrow-up"></i></button>
                 </div>
                 <div class="space-y-2 flex-1">
                    <div class="flex gap-2 h-[34px]">
                        <div class="flex-[1.2] flex items-center gap-1 bg-white border border-[#d9d9d9] p-1 rounded hover:border-[#1677ff] transition-colors min-w-0">
                             <div class="text-[#999] px-1 shrink-0"><i class="el-icon-user"></i></div>
                             <el-select v-model="searchForm.personType" size="mini" class="w-[70px]" :popper-append-to-body="false">
                                <el-option label="综合" value="order"></el-option>
                                <el-option label="师傅" value="master"></el-option>
                             </el-select>
                             <input v-model="searchForm.keyword" type="text" class="bg-transparent text-[13px] text-[#333] outline-none w-full h-full px-1 placeholder-[#ccc] border-l border-[#f0f0f0]" placeholder="关键字" />
                        </div>
                        <div class="flex-1 flex items-center gap-1 bg-white border border-[#d9d9d9] p-1 rounded hover:border-[#1677ff] transition-colors min-w-0">
                            <el-select v-model="searchForm.otherType" size="mini" class="w-[75px]" :popper-append-to-body="false">
                                <el-option label="状态" value="status"></el-option>
                                <el-option label="项目" value="service"></el-option>
                            </el-select>
                            <div class="flex-1 h-full min-w-0 border-l border-[#f0f0f0]">
                                <el-select v-if="searchForm.otherType === 'status'" v-model="searchForm.otherValue" size="mini" class="w-full" :popper-append-to-body="false" placeholder="全部">
                                    <el-option label="全部" value=""></el-option>
                                    <el-option label="待派单" value="待派单"></el-option>
                                    <el-option label="已完成" value="已完成"></el-option>
                                </el-select>
                                <input v-else v-model="searchForm.otherValue" type="text" class="bg-transparent text-[13px] text-[#333] outline-none w-full h-full px-1 placeholder-[#ccc]" placeholder="输入" />
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 bg-white border border-[#d9d9d9] p-1 rounded hover:border-[#1677ff] transition-colors h-[34px]">
                        <div class="text-[#999] px-1"><i class="el-icon-date"></i></div>
                        <el-select v-model="searchForm.timeType" size="mini" class="w-[90px]" :popper-append-to-body="false">
                            <el-option label="创建时间" value="create"></el-option>
                            <el-option label="完成时间" value="finish"></el-option>
                        </el-select>
                        <el-date-picker v-model="searchForm.dateRange" type="datetimerange" range-separator="-" start-placeholder="开始" end-placeholder="结束" size="mini" class="flex-1 !w-full !border-0" prefix-icon="el-icon-time" :clearable="false"></el-date-picker>
                    </div>
                    <div class="flex items-center justify-between gap-3 h-[34px]">
                        <button class="h-full flex-1 bg-white text-[#666] hover:text-[#1677ff] text-[12px] rounded border border-[#d9d9d9] hover:border-[#1677ff] transition-colors">重置</button>
                        <button class="h-full flex-[2] bg-[#1677ff] hover:bg-[#4096ff] text-white text-[12px] rounded transition-all font-bold shadow-sm flex items-center gap-2 justify-center"><i class="el-icon-search"></i> 查询</button>
                    </div>
                 </div>
             </div>
          </div>
        </div>
      </div>

      <!-- 3. Table Area (表格区域) -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col relative z-0">
         <div class="flex-1 overflow-hidden relative">
            <vxe-table
                border="none"
                show-header-overflow
                show-overflow
                :row-config="{isHover: true, height: 58}"
                :data="displayData"
                :loading="loading"
                height="100%"
                auto-resize
                class="no-border-table"
                size="medium"
                :scroll-y="{enabled: true}"
            >
                <!-- 手机号 (压缩: 110->100) -->
                <vxe-column field="mobile" title="客户信息" width="100" fixed="left">
                    <template #default="{ row, rowIndex }">
                    <div class="flex flex-col justify-center h-full">
                        <span class="font-bold text-[#333] text-[13px]">{{ row.mobile }}</span>
                        <span class="text-[11px] text-[#999] mt-0.5">{{ row.contact || '张先生' }}</span>
                    </div>
                    </template>
                </vxe-column>

                <!-- 项目/质保期 (压缩: 130->95, 居中, 完整显示) -->
                <vxe-column field="serviceItem" title="服务内容" width="95" align="center">
                    <template #default="{ row }">
                    <div class="flex flex-col items-center justify-center h-full">
                        <span class="text-[#333] font-medium text-[13px]">{{ row.serviceItem }}</span>
                        <div class="flex items-center justify-center gap-1 mt-0.5">
                            <span class="text-[11px] text-[#1677ff] bg-blue-50 px-1 rounded">{{ row.warranty }}</span>
                        </div>
                    </div>
                    </template>
                </vxe-column>

                <!-- 状态 (扩张: 70->90, 居中) -->
                <vxe-column field="status" title="状态" width="90" align="center">
                    <template #default="{ row }">
                    <div :class="['px-1.5 py-0.5 rounded text-[12px] font-medium inline-block', getStatusClass(row.status)]">
                        {{ row.status }}
                    </div>
                    </template>
                </vxe-column>

                <!-- 系数 (压缩: 70->50, 居中) -->
                <vxe-column field="weightedCoefficient" title="系数" width="50" align="center">
                    <template #default="{ row }">
                        <span class="bg-gray-100 text-[#666] px-1.5 py-0.5 rounded text-[11px] font-bold">{{ row.weightedCoefficient.toFixed(1) }}</span>
                    </template>
                </vxe-column>

                <!-- 地域 (压缩: 150->100, 居中, 完整显示) -->
                <vxe-column field="region" title="区域" width="100" align="center">
                    <template #default="{ row }">
                        <div class="text-[#333] text-[12px]">{{ row.region }}</div>
                    </template>
                </vxe-column>

                <!-- 地址 - (字体增大: 12px -> 13.2px) -->
                <vxe-column field="address" title="地址" min-width="200">
                    <template #default="{ row }">
                    <span class="text-[#333] text-[13.2px] leading-snug line-clamp-2 whitespace-normal break-words" :title="row.address">{{ row.address }}</span>
                    </template>
                </vxe-column>
                
                <!-- 详情 - (字体增大: 12px -> 13.2px) -->
                <vxe-column field="details" title="详情" min-width="260">
                    <template #default="{ row }">
                    <span class="text-[#333] text-[13.2px] leading-snug line-clamp-2 whitespace-normal break-words" :title="row.details">{{ row.details }}</span>
                    </template>
                </vxe-column>

                <!-- 建议分成 (压缩: 65->65) -->
                <vxe-column field="serviceRatio" title="建议分成" width="65" align="center">
                    <template #default="{ row }">
                        <span class="text-[#333] font-bold text-[13px]">{{ row.serviceRatio }}</span>
                    </template>
                </vxe-column>

                <!-- 建议方式 (压缩: 65->65) -->
                <vxe-column field="dispatchMethod" title="建议方式" width="65" align="center">
                    <template #default="{ row }">
                        <span :class="['text-[11px] px-1.5 py-0.5 rounded border', row.dispatchMethod==='抢单'?'text-[#1677ff] border-blue-100 bg-blue-50':'text-[#722ed1] border-purple-100 bg-purple-50']">{{ row.dispatchMethod }}</span>
                    </template>
                </vxe-column>

                <!-- 划线价 (压缩: 65->65) -->
                <vxe-column field="marketPrice" title="划线价" width="65" align="right">
                    <template #default="{ row }">
                        <span class="text-[#333] font-bold">¥{{ row.marketPrice }}</span>
                    </template>
                </vxe-column>
                
                <!-- 历史价 (压缩: 75->75) -->
                <vxe-column field="historyPriceLow" title="历史价" width="75" align="center">
                    <template #default="{ row }">
                        <span class="text-[11px] text-[#333]">{{ row.historyPriceLow }}-{{ row.historyPriceHigh }}</span>
                    </template>
                </vxe-column>

                <!-- 来源 (压缩: 60->60) -->
                <vxe-column field="source" title="来源" width="60" align="center">
                    <template #default="{ row }">
                        <span class="text-[#999] text-[11px] bg-[#f5f5f5] px-1.5 py-0.5 rounded">{{ row.source }}</span>
                    </template>
                </vxe-column>

                <!-- 订单号 (压缩: 105->105) -->
                <vxe-column field="orderNo" title="订单号" width="105">
                    <template #default="{ row }">
                        <div class="flex flex-col gap-0.5 justify-center h-full">
                            <span class="text-[#333] font-sans text-[12px]">{{ row.orderNo }}</span>
                            <span class="text-[#bbb] font-sans text-[11px]">{{ row.workOrderNo }}</span>
                        </div>
                    </template>
                </vxe-column>

                <!-- 时间 (压缩: 105->90) -->
                <vxe-column field="recordTime" title="时间" width="90" align="center">
                    <template #default="{ row }">
                        <div class="flex flex-col gap-0.5 text-[11px] w-full justify-center h-full">
                            <div class="text-[#999]">{{ row.recordTime }}</div>
                            <div class="text-[#333] font-medium">{{ row.expectedTime }}</div>
                        </div>
                    </template>
                </vxe-column>
                
                <!-- 资源 (扩张: 45->60) -->
                <vxe-column field="resource" title="资源" width="60" align="center">
                    <template #default="{ row }">
                        <span class="cursor-pointer text-[12px] text-[#1677ff] hover:underline" @click="checkResource(row)">查看</span>
                    </template>
                </vxe-column>

                <!-- 联系人 - (压缩: 110->110) -->
                <vxe-column title="联系" width="110" align="center">
                    <template #default="{ row }">
                        <div class="flex items-center justify-center gap-1.5">
                            <el-tooltip content="客服" placement="top" :open-delay="500">
                                <div class="w-6 h-6 rounded-full bg-[#1677ff] text-white flex items-center justify-center cursor-pointer hover:bg-[#4096ff] transition-colors shadow-sm" @click="openChat('客服', row)">
                                    <i class="el-icon-service text-xs"></i>
                                </div>
                            </el-tooltip>
                            <el-tooltip content="运营" placement="top" :open-delay="500">
                                <div class="w-6 h-6 rounded-full bg-[#ff9c1e] text-white flex items-center justify-center cursor-pointer hover:bg-[#ffc069] transition-colors shadow-sm" @click="openChat('运营', row)">
                                    <i class="el-icon-user text-xs"></i>
                                </div>
                            </el-tooltip>
                            <el-tooltip content="群聊" placement="top" :open-delay="500">
                                <div class="w-6 h-6 rounded-full bg-[#00b578] text-white flex items-center justify-center cursor-pointer hover:bg-[#5cdbd3] transition-colors shadow-sm" @click="openChat('群聊', row)">
                                    <i class="el-icon-chat-round text-xs"></i>
                                </div>
                            </el-tooltip>
                            <el-tooltip content="售后" placement="top" :open-delay="500">
                                <div class="w-6 h-6 rounded-full bg-[#722ed1] text-white flex items-center justify-center cursor-pointer hover:bg-[#9254de] transition-colors shadow-sm" @click="openChat('售后', row)">
                                    <i class="el-icon-phone-outline text-xs"></i>
                                </div>
                            </el-tooltip>
                        </div>
                    </template>
                </vxe-column>

                <!-- 派单 - (压缩: 70->70) -->
                <vxe-column title="派单" width="70" align="center" fixed="right">
                    <template #default="{ row }">
                        <div v-if="row.status === '待派单'" class="relative flex justify-center items-center w-full h-full">
                            <el-popover placement="left" width="120" trigger="click">
                                <div class="flex flex-col gap-1">
                                    <el-button size="mini" type="text" @click="handleDispatch(row)">线下派单</el-button>
                                    <el-button size="mini" type="text" @click="handleDispatch(row)">线上派单</el-button>
                                </div>
                                <button slot="reference" class="bg-[#1677ff] hover:bg-[#4096ff] text-white text-[12px] py-1 px-3 rounded-md shadow-sm transition-all active:scale-95 font-medium relative z-10">
                                    派单
                                </button>
                            </el-popover>
                            <span v-if="row.dispatchStatus !== '正常'" class="absolute top-1 right-0 bg-[#ff574d] text-white text-[9px] px-1 rounded-full shadow-sm z-20 font-bold leading-none animate-float-jump border border-white">{{ row.dispatchStatus }}</span>
                        </div>
                    </template>
                </vxe-column>

                <!-- 操作 - (压缩: 70->70) -->
                <vxe-column title="操作" width="70" align="center" fixed="right" :show-overflow="false">
                    <template #default="{ row }">
                        <el-dropdown trigger="click" size="small" placement="bottom-end" @command="(cmd) => handleAction(cmd, row)">
                            <div class="cursor-pointer bg-white border border-[#dcdfe6] hover:border-[#409eff] text-[#606266] hover:text-[#409eff] rounded px-2 py-1 text-[12px] flex items-center justify-center gap-1 transition-all shadow-sm" style="min-width: 54px;">
                                <span>操作</span>
                                <i class="el-icon-arrow-down text-[10px]"></i>
                            </div>
                            <el-dropdown-menu slot="dropdown" class="w-[140px] user-select-none">
                                <el-dropdown-item command="复制"><i class="el-icon-document-copy text-gray-500 mr-2"></i>复制订单</el-dropdown-item>
                                <el-dropdown-item command="开票"><i class="el-icon-document text-blue-500 mr-2"></i>开票</el-dropdown-item>
                                <el-dropdown-item command="完单"><i class="el-icon-circle-check text-green-500 mr-2"></i>完单</el-dropdown-item>
                                <el-dropdown-item command="详情"><i class="el-icon-info text-gray-400 mr-2"></i>详情</el-dropdown-item>
                                <el-dropdown-item command="查资源"><i class="el-icon-search text-purple-500 mr-2"></i>查资源</el-dropdown-item>
                                <el-dropdown-item command="添加报错"><i class="el-icon-warning-outline text-orange-500 mr-2"></i>添加报错</el-dropdown-item>
                                <el-dropdown-item command="作废"><i class="el-icon-delete text-red-500 mr-2"></i>作废</el-dropdown-item>
                                <el-dropdown-item command="其他收款"><i class="el-icon-money text-teal-500 mr-2"></i>其他收款</el-dropdown-item>
                                <el-dropdown-item command="中转"><i class="el-icon-sort text-blue-500 mr-2"></i>中转</el-dropdown-item>
                                <el-dropdown-item command="修改"><i class="el-icon-edit text-blue-500 mr-2"></i>修改</el-dropdown-item>
                                <el-dropdown-item command="取消"><i class="el-icon-circle-close text-red-500 mr-2"></i>取消</el-dropdown-item>
                            </el-dropdown-menu>
                        </el-dropdown>
                    </template>
                </vxe-column>
            </vxe-table>
         </div>
         
         <!-- Footer / Pagination - 居中显示，包含所有布局元素 -->
         <div class="bg-white px-4 py-3 border-t border-[#f0f0f0] flex justify-center items-center shrink-0 z-10 relative">
            <el-pagination
                background
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                :current-page="page.currentPage"
                :page-sizes="[10, 20, 50, 100]"
                :page-size="page.pageSize"
                layout="total, sizes, prev, pager, next, jumper"
                :total="page.total">
            </el-pagination>
         </div>
      </div>

      <!-- Modals -->
      <el-dialog :visible.sync="modals.chat.visible" :title="'联系' + modals.chat.role" width="500px" append-to-body>
         <div class="bg-[#f5f5f5] p-4 rounded-lg h-64 overflow-y-auto mb-4 border border-[#e8e8e8]">
            <div class="flex gap-3">
               <div class="w-8 h-8 rounded-full bg-[#1677ff] flex items-center justify-center text-white text-xs font-bold">{{ modals.chat.role[0] }}</div>
               <div class="bg-white p-2 rounded-lg shadow-sm text-sm text-[#333] max-w-[80%] border border-[#f0f0f0]">您好，我是{{ modals.chat.role }}，请问订单 {{ modals.chat.order?.orderNo }} 有什么问题？</div>
            </div>
         </div>
         <div class="flex gap-2">
            <el-input v-model="modals.chat.message" placeholder="输入消息..." size="small"></el-input>
            <el-button type="primary" size="small" style="background-color: #1677ff; border-color: #1677ff;">发送</el-button>
         </div>
      </el-dialog>

      <el-dialog :visible.sync="modals.complete.visible" title="完成订单" width="400px" append-to-body>
         <div class="bg-green-50 p-4 rounded-lg border border-green-100 mb-4 text-[#00b578]">
             <div class="flex justify-between items-center mb-2">
                 <span>应收金额</span>
                 <span class="text-xl font-bold font-sans">¥{{ modals.complete.amount }}</span>
             </div>
             <p class="text-xs opacity-80">请确认实际收到款项后再点击完成。</p>
         </div>
         <el-form label-width="80px" size="small">
             <el-form-item label="实收金额">
                <el-input type="number" v-model="modals.complete.amount" class="font-sans"></el-input>
             </el-form-item>
         </el-form>
         <div slot="footer">
             <el-button size="small" @click="modals.complete.visible = false">取消</el-button>
             <el-button size="small" type="primary" @click="modals.complete.visible = false; $message.success('订单已完成')" style="background-color: #00b578; border-color: #00b578;">确认完成</el-button>
         </div>
      </el-dialog>

    </div>
  `
});
