
    // 1. Live Supabase Client
    const SUPABASE_URL = 'https://mmbtfbxxnprtzpzdklot.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA';
    let supabase = null;
    try {
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      }
    } catch(e) {
      console.warn('Supabase initialization notice:', e);
    }

    // 2. Default State & Seed Data (in Indian Rupees ₹)
    const defaultPlans = [
      { id: 'plan-standard', name: 'Standard Club Plan', fee: 500, billingCycle: 'monthly', description: 'Full access to general club facilities, lounge, and community events.', color: '#3b82f6', active: true, lateFeeDays: 10, lateFeeAmount: 50 },
      { id: 'plan-premium', name: 'Premium Sports & Gym', fee: 1000, billingCycle: 'monthly', description: 'All Standard perks plus fitness gym, sports coaching, sauna, and grounds.', color: '#8b5cf6', active: true, lateFeeDays: 10, lateFeeAmount: 100 },
      { id: 'plan-vip', name: 'VIP Executive Plan', fee: 2500, billingCycle: 'monthly', description: 'Executive lounge, priority ground bookings, free guest passes & lockers.', color: '#f59e0b', active: true, lateFeeDays: 10, lateFeeAmount: 200 },
      { id: 'plan-student', name: 'Student & Youth Athlete', fee: 300, billingCycle: 'monthly', description: 'Discounted membership for youth athletes & students with club training.', color: '#10b981', active: true, lateFeeDays: 10, lateFeeAmount: 25 }
    ];

    const defaultEarnings = [
      { id: 'earn-1', title: 'Annual Summer Cricket Tournament Entry Fees', category: 'tournament', amount: 25000, date: '2026-08-14', paymentMethod: 'upi', payerOrCustomer: '24 Participating Teams', referenceNo: 'TRN-2026-08', description: 'Entry fees for club tournament.' },
      { id: 'earn-2', title: 'Corporate Ground Banner Sponsorship (Q3)', category: 'sponsorship', amount: 50000, date: '2026-08-10', paymentMethod: 'bank_transfer', payerOrCustomer: 'Apex Sports India', referenceNo: 'SPON-Q3-091', description: 'Main pavilion banner placement.' },
      { id: 'earn-3', title: 'Clubhouse Canteen & Tea Stall August Revenue', category: 'canteen_bar', amount: 12400, date: '2026-08-20', paymentMethod: 'cash', payerOrCustomer: 'Canteen Counter', referenceNo: 'CAN-AUG-2026', description: 'Snacks, beverages, and breakfast sales.' },
      { id: 'earn-4', title: 'Official Club Jersey & Sports Kit Sales', category: 'merchandise', amount: 8500, date: '2026-08-08', paymentMethod: 'upi', payerOrCustomer: 'Club Pro Shop', referenceNo: 'MERCH-8832', description: 'Club jerseys, caps, and wristbands.' }
    ];

    // State Variables
    let plans = JSON.parse(localStorage.getItem('fp_plans') || JSON.stringify(defaultPlans));
    let members = JSON.parse(localStorage.getItem('fp_members') || '[]');
    let payments = JSON.parse(localStorage.getItem('fp_payments') || '[]');
    let earnings = JSON.parse(localStorage.getItem('fp_earnings') || JSON.stringify(defaultEarnings));
    let activeMonth = '2026-08';

    // Currency Formatter (₹ INR)
    function formatINR(val) {
      return '₹' + Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }

    // Navigation & Tab Switcher (identical to Admin panel)
    function nav(tabName) {
      console.log('Navigating to tab:', tabName);
      window.nav = nav;

      // 1. Deactivate all buttons & hide all panels
      document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.classList.remove('active');
      });

      document.querySelectorAll('.view-panel').forEach(function(panel) {
        panel.classList.remove('active');
        panel.style.display = 'none';
      });

      // 2. Activate target button & target panel
      const activeBtn = document.getElementById('tab-' + tabName);
      const activePanel = document.getElementById('view-' + tabName);

      if (activeBtn) activeBtn.classList.add('active');
      if (activePanel) {
        activePanel.classList.add('active');
        activePanel.style.display = 'block';
      }

      // 3. Render contents
      try {
        if (tabName === 'dashboard') renderDashboard();
        else if (tabName === 'checklist') renderChecklist();
        else if (tabName === 'members') renderMembers();
        else if (tabName === 'plans') renderPlans();
        else if (tabName === 'earnings') renderEarnings();
      } catch(err) {
        console.error('Render error in tab ' + tabName + ':', err);
      }
    };

    // Modal Control
    function openModal(id) {
      window.openModal = openModal;
      const el = document.getElementById(id);
      if (el) el.classList.add('active');
      if (id === 'add-member-modal') populatePlanOptions();
    };

    function closeModal(id) {
      window.closeModal = closeModal;
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    };

    function populatePlanOptions() {
      const sel = document.getElementById('mem-plan');
      if (!sel) return;
      sel.innerHTML = plans.map(p => `<option value="${p.id}">${p.name} (${formatINR(p.fee)}/mo)</option>`).join('');
    }

    function handleMemberPlanSelect(planId) {
      const p = plans.find(x => x.id === planId);
      if (p) {
        document.getElementById('mem-custom-fee').placeholder = `Default: ${formatINR(p.fee)}`;
      }
    }

    function handleMonthChange(m) {
      window.handleMonthChange = handleMonthChange;
      activeMonth = m;
      renderDashboard();
      renderChecklist();
    };

    // ══════════════════════════════════════════
    // 1. DASHBOARD RENDER
    // ══════════════════════════════════════════
    function renderDashboard() {
      let feesCollected = 0;
      let feesExpected = 0;
      let feesPending = 0;
      let pendingCount = 0;
      let overdueCount = 0;

      members.forEach(m => {
        if (m.status !== 'active') return;
        const plan = plans.find(p => p.id === m.planId);
        const fee = (m.customFee !== undefined && m.customFee !== null && m.customFee >= 0) ? m.customFee : (plan ? plan.fee : 0);
        feesExpected += fee;

        const pay = payments.find(p => p.memberId === m.id && p.monthYear === activeMonth);
        if (pay && pay.status === 'paid') {
          feesCollected += (pay.paidAmount || pay.amount);
        } else {
          feesPending += fee;
          pendingCount++;
          if (pay && pay.status === 'overdue') overdueCount++;
        }
      });

      let totalOtherEarnings = earnings.reduce((sum, e) => sum + (e.amount || 0), 0);
      let totalClubRevenue = feesCollected + totalOtherEarnings;
      let collectionRate = feesExpected > 0 ? Math.round((feesCollected / feesExpected) * 100) : 0;

      const elRev = document.getElementById('dash-total-revenue');
      const elCol = document.getElementById('dash-fees-collected');
      const elTar = document.getElementById('dash-target-fees');
      const elRate = document.getElementById('dash-rate');
      const elPen = document.getElementById('dash-fees-pending');
      const elPenCnt = document.getElementById('dash-pending-count');
      const elOvdCnt = document.getElementById('dash-overdue-count');
      const elOth = document.getElementById('dash-other-earnings');

      if (elRev) elRev.textContent = formatINR(totalClubRevenue);
      if (elCol) elCol.textContent = formatINR(feesCollected);
      if (elTar) elTar.textContent = `Target: ${formatINR(feesExpected)}`;
      if (elRate) elRate.textContent = `${collectionRate}%`;
      if (elPen) elPen.textContent = formatINR(feesPending);
      if (elPenCnt) elPenCnt.textContent = `${pendingCount} members pending`;
      if (elOvdCnt) elOvdCnt.textContent = `${overdueCount} overdue`;
      if (elOth) elOth.textContent = formatINR(totalOtherEarnings);

      // Recent Transactions
      const tbody = document.getElementById('dash-recent-tbody');
      if (!tbody) return;

      let rows = [];
      earnings.slice(0, 4).forEach(e => {
        rows.push(`
          <tr>
            <td><span class="badge badge-paid">EARNING</span></td>
            <td style="font-weight:700; color:#fff;">${e.title}</td>
            <td style="color:var(--text-muted);">${e.category}</td>
            <td class="font-mono" style="color:var(--text-dim);">${e.date}</td>
            <td style="font-weight:800; color:#34d399;">+${formatINR(e.amount)}</td>
            <td class="font-mono" style="color:var(--text-dim);">${e.referenceNo || '-'}</td>
          </tr>
        `);
      });

      payments.slice(0, 4).forEach(p => {
        const m = members.find(x => x.id === p.memberId);
        if (!m) return;
        rows.push(`
          <tr>
            <td><span class="badge badge-blue">MEMBER FEE</span></td>
            <td style="font-weight:700; color:#fff;">${m.name}</td>
            <td style="color:var(--text-muted);">${p.monthYear} Fee</td>
            <td class="font-mono" style="color:var(--text-dim);">${p.paidAt ? p.paidAt.split('T')[0] : activeMonth}</td>
            <td style="font-weight:800; color:#34d399;">+${formatINR(p.paidAmount || p.amount)}</td>
            <td><span class="badge badge-paid">PAID</span></td>
          </tr>
        `);
      });

      if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">No transactions recorded yet. Click "+ Add Member" or "+ Add Earning" to start!</td></tr>';
      } else {
        tbody.innerHTML = rows.join('');
      }
    }

    // ══════════════════════════════════════════
    // 2. CHECKLIST RENDER & ACTIONS
    // ══════════════════════════════════════════
    function renderChecklist() {
      const tbody = document.getElementById('checklist-tbody');
      if (!tbody) return;

      const q = (document.getElementById('checklist-search')?.value || '').toLowerCase();
      const filtered = members.filter(m => {
        if (m.status !== 'active') return false;
        if (q && !m.name.toLowerCase().includes(q) && !(m.role||'').toLowerCase().includes(q) && !(m.phone||'').includes(q)) return false;
        return true;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted);">No members found. Click "+ Add Member" to add your first member.</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.map(m => {
        const plan = plans.find(p => p.id === m.planId);
        const fee = (m.customFee !== undefined && m.customFee !== null && m.customFee >= 0) ? m.customFee : (plan ? plan.fee : 0);
        const pay = payments.find(p => p.memberId === m.id && p.monthYear === activeMonth);
        const isPaid = pay && pay.status === 'paid';
        const isOverdue = pay && pay.status === 'overdue';

        let statusBadge = isPaid 
          ? '<span class="badge badge-paid">✓ PAID</span>'
          : (isOverdue ? '<span class="badge badge-overdue">⚠️ OVERDUE</span>' : '<span class="badge badge-pending">⏳ PENDING</span>');

        let actions = isPaid
          ? `<button onclick="viewReceipt('${m.id}', '${activeMonth}')" class="btn btn-secondary" style="padding:4px 10px; font-size:11px;">🧾 Receipt</button>`
          : `
            <div style="display:flex; gap:6px; justify-content:flex-end;">
              <button onclick="markPaymentPaid('${m.id}', '${activeMonth}', 'cash')" class="btn btn-emerald" style="padding:4px 8px; font-size:11px;">💵 Cash</button>
              <button onclick="markPaymentPaid('${m.id}', '${activeMonth}', 'upi')" class="btn btn-primary" style="padding:4px 8px; font-size:11px;">📱 UPI</button>
            </div>
          `;

        return `
          <tr>
            <td>
              <div style="font-weight:700; color:#fff; font-size:13px;">${m.name}</div>
              <div style="font-size:11px; color:var(--text-dim);">${m.phone || m.email || ''}</div>
            </td>
            <td><span class="badge badge-blue">${m.role || 'Member'}</span></td>
            <td style="font-weight:600; color:#fff;">${plan ? plan.name : 'Standard'}</td>
            <td style="font-weight:800; color:#34d399; font-size:13px;">${formatINR(fee)}</td>
            <td>${statusBadge}</td>
            <td class="font-mono" style="color:var(--text-muted); text-transform:uppercase;">${isPaid ? (pay.paymentMethod || 'cash') : '-'}</td>
            <td style="text-align:right;">${actions}</td>
          </tr>
        `;
      }).join('');
    }

    function markPaymentPaid(memberId, mStr, method) {
      window.markPaymentPaid = markPaymentPaid;
      const m = members.find(x => x.id === memberId);
      if (!m) return;
      const plan = plans.find(p => p.id === m.planId);
      const fee = (m.customFee !== undefined && m.customFee !== null && m.customFee >= 0) ? m.customFee : (plan ? plan.fee : 0);

      const existingIndex = payments.findIndex(p => p.memberId === memberId && p.monthYear === mStr);
      const invoiceNo = 'INV-' + mStr.replace('-', '') + '-' + Date.now().toString().slice(-4);
      const payObj = {
        id: 'pay-' + mStr + '-' + memberId,
        memberId,
        planId: m.planId,
        monthYear: mStr,
        amount: fee,
        paidAmount: fee,
        status: 'paid',
        paymentMethod: method || 'cash',
        paidAt: new Date().toISOString(),
        invoiceNo,
        notes: `Paid via ${method}`
      };

      if (existingIndex !== -1) payments[existingIndex] = payObj;
      else payments.push(payObj);

      saveData();
      renderChecklist();
      renderDashboard();
    };

    function viewReceipt(memberId, mStr) {
      window.viewReceipt = viewReceipt;
      const m = members.find(x => x.id === memberId);
      const p = payments.find(x => x.memberId === memberId && x.monthYear === mStr);
      if (!m || !p) return;
      const plan = plans.find(x => x.id === m.planId);

      document.getElementById('rec-invoice').textContent = p.invoiceNo || 'INV-2026-08';
      document.getElementById('rec-name').textContent = m.name;
      document.getElementById('rec-role').textContent = m.role || 'Member';
      document.getElementById('rec-plan').textContent = plan ? plan.name : 'Standard';
      document.getElementById('rec-month').textContent = p.monthYear;
      document.getElementById('rec-method').textContent = (p.paymentMethod || 'cash').toUpperCase();
      document.getElementById('rec-date').textContent = p.paidAt ? p.paidAt.split('T')[0] : 'Today';
      document.getElementById('rec-amount').textContent = formatINR(p.paidAmount || p.amount);

      openModal('receipt-modal');
    };

    // ══════════════════════════════════════════
    // 3. MEMBERS DIRECTORY RENDER & ACTIONS
    // ══════════════════════════════════════════
    function renderMembers() {
      const container = document.getElementById('members-cards-container');
      if (!container) return;

      const q = (document.getElementById('members-search')?.value || '').toLowerCase();
      const filtered = members.filter(m => {
        if (q && !m.name.toLowerCase().includes(q) && !(m.role||'').toLowerCase().includes(q) && !(m.email||'').toLowerCase().includes(q)) return false;
        return true;
      });

      if (filtered.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:48px; background:var(--card); border:1px solid var(--border); border-radius:18px; color:var(--text-muted);">No members in directory. Click "+ Add Member" to register your first club member.</div>';
        return;
      }

      container.innerHTML = filtered.map(m => {
        const plan = plans.find(p => p.id === m.planId);
        const fee = (m.customFee !== undefined && m.customFee !== null && m.customFee >= 0) ? m.customFee : (plan ? plan.fee : 0);

        return `
          <div class="card" style="display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="display:flex; align-items:center; gap:12px;">
                  <div style="width:40px; height:40px; border-radius:12px; background:linear-gradient(135deg,#4f46e5,#9333ea); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:14px;">
                    ${m.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 style="font-size:15px; font-weight:800; color:#fff;">${m.name}</h3>
                    <span class="badge badge-paid">${m.role || 'Member'}</span>
                  </div>
                </div>
                <span class="badge badge-blue">${(m.status || 'active').toUpperCase()}</span>
              </div>

              <div style="margin-top:14px; background:#090f1d; padding:12px; border-radius:12px; border:1px solid var(--border); display:flex; flex-direction:column; gap:6px; font-size:12px;">
                <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-muted);">Phone:</span> <span style="color:#fff; font-weight:600;">${m.phone || '-'}</span></div>
                <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-muted);">Email:</span> <span style="color:#fff;">${m.email || '-'}</span></div>
                <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-muted);">Plan:</span> <span style="color:#818cf8; font-weight:700;">${plan ? plan.name : 'Standard'}</span></div>
                <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-muted);">Monthly Fee:</span> <span style="color:#34d399; font-weight:900;">${formatINR(fee)}</span></div>
                ${m.customFields?.lockerNumber ? `<div style="display:flex; justify-content:space-between;"><span style="color:var(--text-muted);">Locker:</span> <span style="color:#fff; font-weight:700;">${m.customFields.lockerNumber}</span></div>` : ''}
              </div>
            </div>

            <div style="margin-top:14px; padding-top:12px; border-top:1px solid var(--border); display:flex; gap:8px;">
              <button onclick="editMember('${m.id}')" class="btn btn-secondary" style="flex:1;">✏️ Edit</button>
              <button onclick="deleteMember('${m.id}', '${m.name}')" class="btn btn-danger" style="padding:8px 12px;">🗑️</button>
            </div>
          </div>
        `;
      }).join('');
    }

    function handleSaveMember(e) {
      window.handleSaveMember = handleSaveMember;
      e.preventDefault();
      const id = document.getElementById('mem-id').value || ('mem-' + Date.now());
      const name = document.getElementById('mem-name').value.trim();
      const email = document.getElementById('mem-email').value.trim();
      const phone = document.getElementById('mem-phone').value.trim();
      const planId = document.getElementById('mem-plan').value;
      const role = document.getElementById('mem-role').value;
      const customFeeRaw = document.getElementById('mem-custom-fee').value;
      const customFee = customFeeRaw !== '' ? Number(customFeeRaw) : null;
      const joinDate = document.getElementById('mem-join-date').value || new Date().toISOString().split('T')[0];
      const lockerNumber = document.getElementById('mem-locker').value.trim();
      const sportActivity = document.getElementById('mem-activity').value.trim();

      const memberObj = {
        id, name, email, phone, planId, role, customFee, joinDate, status: 'active',
        customFields: { lockerNumber, sportActivity }
      };

      const idx = members.findIndex(x => x.id === id);
      if (idx !== -1) members[idx] = memberObj;
      else members.unshift(memberObj);

      saveData();
      closeModal('add-member-modal');
      renderMembers();
      renderChecklist();
      renderDashboard();
    };

    function editMember(id) {
      window.editMember = editMember;
      const m = members.find(x => x.id === id);
      if (!m) return;
      document.getElementById('add-member-title').textContent = `✏️ Edit "${m.name}"`;
      document.getElementById('mem-id').value = m.id;
      document.getElementById('mem-name').value = m.name;
      document.getElementById('mem-email').value = m.email || '';
      document.getElementById('mem-phone').value = m.phone || '';
      document.getElementById('mem-role').value = m.role || 'Member';
      document.getElementById('mem-custom-fee').value = m.customFee !== null ? m.customFee : '';
      document.getElementById('mem-join-date').value = m.joinDate || '';
      document.getElementById('mem-locker').value = m.customFields?.lockerNumber || '';
      document.getElementById('mem-activity').value = m.customFields?.sportActivity || '';

      populatePlanOptions();
      document.getElementById('mem-plan').value = m.planId;

      openModal('add-member-modal');
    };

    function deleteMember(id, name) {
      window.deleteMember = deleteMember;
      if (confirm(`Are you sure you want to delete member "${name}"?`)) {
        members = members.filter(x => x.id !== id);
        payments = payments.filter(x => x.memberId !== id);
        saveData();
        renderMembers();
        renderChecklist();
        renderDashboard();
      }
    };

    // ══════════════════════════════════════════
    // 4. PLANS VIEW RENDER & ACTIONS
    // ══════════════════════════════════════════
    function renderPlans() {
      const container = document.getElementById('plans-cards-container');
      if (!container) return;

      container.innerHTML = plans.map(plan => {
        const count = members.filter(m => m.planId === plan.id && m.status === 'active').length;
        return `
          <div class="card" style="display:flex; flex-direction:column; justify-content:space-between; border-top:3px solid ${plan.color || '#3b82f6'};">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <h3 style="font-size:16px; font-weight:800; color:#fff;">${plan.name}</h3>
                <button onclick="deletePlan('${plan.id}', '${plan.name}')" style="background:transparent; border:none; color:var(--text-dim); cursor:pointer; font-size:14px;">🗑️</button>
              </div>
              <p style="font-size:11px; color:var(--text-muted); margin-top:6px; min-height:32px;">${plan.description || ''}</p>

              <div style="margin-top:14px; background:#090f1d; padding:12px; border-radius:12px; border:1px solid var(--border);">
                <span style="font-size:11px; color:var(--text-muted); display:block;">Monthly Fee</span>
                <span style="font-size:24px; font-weight:900; color:#34d399;">${formatINR(plan.fee)}</span>
              </div>

              <div style="margin-top:10px; font-size:11px; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; display:flex; flex-direction:column; gap:4px;">
                <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-muted);">Enrolled:</span> <span style="font-weight:700; color:#fff;">${count} members</span></div>
                <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-muted);">Grace Period:</span> <span style="font-weight:700; color:#fbbf24;">${plan.lateFeeDays || 10} days</span></div>
                <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-muted);">Late Fine:</span> <span style="font-weight:700; color:#f87171;">${formatINR(plan.lateFeeAmount || 50)}</span></div>
              </div>
            </div>

            <div style="margin-top:14px; padding-top:12px; border-top:1px solid var(--border);">
              <button onclick="editPlan('${plan.id}')" class="btn btn-secondary" style="width:100%;">✏️ Edit Plan</button>
            </div>
          </div>
        `;
      }).join('');
    }

    function openAddPlanModal() {
      window.openAddPlanModal = openAddPlanModal;
      document.getElementById('plan-modal-title').textContent = '➕ Add New Membership Plan';
      document.getElementById('plan-id').value = 'plan-' + Date.now();
      document.getElementById('plan-name').value = '';
      document.getElementById('plan-fee').value = 500;
      document.getElementById('plan-desc').value = '';
      document.getElementById('plan-grace').value = 10;
      document.getElementById('plan-late-fine').value = 50;
      document.getElementById('plan-color').value = '#3b82f6';
      openModal('plan-modal');
    };

    function editPlan(id) {
      window.editPlan = editPlan;
      const p = plans.find(x => x.id === id);
      if (!p) return;
      document.getElementById('plan-modal-title').textContent = `✏️ Edit "${p.name}"`;
      document.getElementById('plan-id').value = p.id;
      document.getElementById('plan-name').value = p.name;
      document.getElementById('plan-fee').value = p.fee;
      document.getElementById('plan-desc').value = p.description || '';
      document.getElementById('plan-grace').value = p.lateFeeDays || 10;
      document.getElementById('plan-late-fine').value = p.lateFeeAmount || 50;
      document.getElementById('plan-color').value = p.color || '#3b82f6';
      openModal('plan-modal');
    };

    function handleSavePlan(e) {
      window.handleSavePlan = handleSavePlan;
      e.preventDefault();
      const id = document.getElementById('plan-id').value;
      const name = document.getElementById('plan-name').value.trim();
      const fee = Number(document.getElementById('plan-fee').value) || 0;
      const description = document.getElementById('plan-desc').value.trim();
      const lateFeeDays = Number(document.getElementById('plan-grace').value) || 10;
      const lateFeeAmount = Number(document.getElementById('plan-late-fine').value) || 50;
      const color = document.getElementById('plan-color').value;

      const planObj = { id, name, fee, description, lateFeeDays, lateFeeAmount, color, active: true, billingCycle: 'monthly' };

      const idx = plans.findIndex(x => x.id === id);
      if (idx !== -1) plans[idx] = planObj;
      else plans.push(planObj);

      saveData();
      closeModal('plan-modal');
      renderPlans();
      renderMembers();
      renderChecklist();
    };

    function deletePlan(id, name) {
      window.deletePlan = deletePlan;
      const enrolled = members.filter(m => m.planId === id && m.status === 'active').length;
      if (enrolled > 0) {
        alert(`Cannot delete "${name}" because it has ${enrolled} active member(s) enrolled.`);
        return;
      }
      if (confirm(`Delete plan "${name}"?`)) {
        plans = plans.filter(x => x.id !== id);
        saveData();
        renderPlans();
      }
    };

    // ══════════════════════════════════════════
    // 5. EARNINGS LOGGER RENDER & ACTIONS
    // ══════════════════════════════════════════
    function renderEarnings() {
      const tbody = document.getElementById('earnings-tbody');
      if (!tbody) return;

      if (earnings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted);">No earnings recorded. Click "+ Log New Earning" to record income.</td></tr>';
        return;
      }

      tbody.innerHTML = earnings.map(e => `
        <tr>
          <td style="font-weight:700; color:#fff; font-size:13px;">${e.title}</td>
          <td><span class="badge badge-blue">${e.category}</span></td>
          <td style="color:#fff;">${e.payerOrCustomer || '-'}</td>
          <td class="font-mono" style="color:var(--text-dim);">${e.date}</td>
          <td class="font-mono" style="color:var(--text-muted); text-transform:uppercase;">${e.paymentMethod || 'cash'}</td>
          <td style="font-weight:900; color:#34d399; font-size:13px;">+${formatINR(e.amount)}</td>
          <td style="text-align:right;">
            <button onclick="deleteEarning('${e.id}')" class="btn btn-danger" style="padding:4px 8px; font-size:11px;">🗑️</button>
          </td>
        </tr>
      `).join('');
    }

    function handleSaveEarning(e) {
      window.handleSaveEarning = handleSaveEarning;
      e.preventDefault();
      const title = document.getElementById('earn-title').value.trim();
      const amount = Number(document.getElementById('earn-amount').value) || 0;
      const category = document.getElementById('earn-category').value;
      const paymentMethod = document.getElementById('earn-method').value;
      const date = document.getElementById('earn-date').value || new Date().toISOString().split('T')[0];
      const payerOrCustomer = document.getElementById('earn-payer').value.trim();
      const referenceNo = document.getElementById('earn-ref').value.trim() || ('REC-' + Date.now().toString().slice(-6));

      const earningObj = { id: 'earn-' + Date.now(), title, amount, category, paymentMethod, date, payerOrCustomer, referenceNo };

      earnings.unshift(earningObj);
      saveData();
      closeModal('add-earning-modal');
      renderEarnings();
      renderDashboard();
    };

    function deleteEarning(id) {
      window.deleteEarning = deleteEarning;
      if (confirm('Delete this earning entry?')) {
        earnings = earnings.filter(x => x.id !== id);
        saveData();
        renderEarnings();
        renderDashboard();
      }
    };

    // ══════════════════════════════════════════
    // PERSISTENCE & CLOUD SYNC
    // ══════════════════════════════════════════
    function saveData() {
      localStorage.setItem('fp_plans', JSON.stringify(plans));
      localStorage.setItem('fp_members', JSON.stringify(members));
      localStorage.setItem('fp_payments', JSON.stringify(payments));
      localStorage.setItem('fp_earnings', JSON.stringify(earnings));

      // Background Supabase Push
      if (supabase) {
        if (members.length > 0) {
          const payload = members.map(m => ({
            id: m.id, name: m.name, email: m.email, phone: m.phone,
            plan_id: m.planId, role: m.role, custom_fee: m.customFee,
            join_date: m.joinDate, status: m.status, custom_fields: m.customFields || {}
          }));
          supabase.from('members').upsert(payload).then(() => {});
        }
        if (plans.length > 0) {
          const pPayload = plans.map(p => ({
            id: p.id, name: p.name, fee: p.fee, billing_cycle: p.billingCycle,
            description: p.description, color: p.color, active: p.active,
            late_fee_days: p.lateFeeDays, late_fee_amount: p.lateFeeAmount
          }));
          supabase.from('membership_plans').upsert(pPayload).then(() => {});
        }
        if (earnings.length > 0) {
          const ePayload = earnings.map(e => ({
            id: e.id, title: e.title, category: e.category, amount: e.amount,
            date: e.date, payment_method: e.paymentMethod, payer_or_customer: e.payerOrCustomer,
            reference_no: e.referenceNo, description: e.description
          }));
          supabase.from('club_earnings').upsert(ePayload).then(() => {});
        }
        if (payments.length > 0) {
          const payPayload = payments.map(p => ({
            id: p.id, member_id: p.memberId, plan_id: p.planId, month_year: p.monthYear,
            amount: p.amount, paid_amount: p.paidAmount, status: p.status, payment_method: p.paymentMethod,
            paid_at: p.paidAt, invoice_no: p.invoiceNo, notes: p.notes
          }));
          supabase.from('payment_records').upsert(payPayload).then(() => {});
        }
      }
    }

    
    // Global function exposures
    window.nav = nav;
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.markPaymentPaid = markPaymentPaid;
    window.viewReceipt = viewReceipt;
    window.handleSaveMember = handleSaveMember;
    window.editMember = editMember;
    window.deleteMember = deleteMember;
    window.openAddPlanModal = openAddPlanModal;
    window.editPlan = editPlan;
    window.handleSavePlan = handleSavePlan;
    window.deletePlan = deletePlan;
    window.handleSaveEarning = handleSaveEarning;
    window.deleteEarning = deleteEarning;
    window.handleMonthChange = handleMonthChange;

    // Portal Bootloader
    function init() {
      console.log('KNSDC Finance Portal Initializing...');
      nav('dashboard');

      // Bind click listeners directly to all navigation tabs
      ['dashboard', 'checklist', 'members', 'plans', 'earnings', 'custom-fields'].forEach(function(t) {
        var btn = document.getElementById('tab-' + t);
        if (btn) {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            nav(t);
          });
        }
      });


      // Background Supabase Pull
      setTimeout(async () => {
        if (!supabase) return;
        try {
          const { data: dbPlans, error: ep } = await supabase.from('membership_plans').select('*');
          if (!ep && dbPlans && dbPlans.length > 0) {
            plans = dbPlans.map(p => ({
              id: p.id, name: p.name, fee: Number(p.fee) || 0,
              billingCycle: p.billing_cycle || 'monthly', description: p.description || '',
              color: p.color || '#3b82f6', active: p.active !== false,
              lateFeeDays: p.late_fee_days || 10, lateFeeAmount: Number(p.late_fee_amount) || 50
            }));
          }

          const { data: dbMembers, error: em } = await supabase.from('members').select('*');
          if (!em && dbMembers && dbMembers.length > 0) {
            members = dbMembers.map(m => ({
              id: m.id, name: m.name, email: m.email || '', phone: m.phone || '',
              planId: m.plan_id, role: m.role || 'Member',
              customFee: m.custom_fee !== null ? Number(m.custom_fee) : null,
              joinDate: m.join_date, status: m.status || 'active',
              customFields: m.custom_fields || {}
            }));
          }

          const { data: dbEarnings, error: ee } = await supabase.from('club_earnings').select('*');
          if (!ee && dbEarnings && dbEarnings.length > 0) {
            earnings = dbEarnings.map(e => ({
              id: e.id, title: e.title, category: e.category, amount: Number(e.amount) || 0,
              date: e.date, paymentMethod: e.payment_method, payerOrCustomer: e.payerOrCustomer,
              referenceNo: e.reference_no, description: e.description
            }));
          }

          renderDashboard();
        } catch(err) {
          console.warn('Background sync notice:', err);
        }
      }, 600);
    }

    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  