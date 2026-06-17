
    const timelineData = {
      mission: {
        title: "Our Mission",
        items: [
          { title: "Cultural Extravaganza", desc: "Organize Laxmi Puja & organize dance competition named Dance Ignition Season 5." },
          { title: "Social Welfare", desc: "Blood donation camp & tree plantation drives." },
          { title: "Infrastructure", desc: "Build our club a little more & decorated our club." }
        ]
      },
      vision: {
        title: "Our Vision",
        items: [
          { title: "Community Bonding", desc: "Bringing people together through shared cultural experiences." },
          { title: "Youth Empowerment", desc: "Providing a platform for young talents to showcase their skills." },
          { title: "Sustainable Future", desc: "Promoting green initiatives and health awareness in Kalikapur." }
        ]
      },
      values: {
        title: "Our Values",
        items: [
          { title: "Inclusivity", desc: "Welcoming everyone from all walks of life to join our initiatives." },
          { title: "Dedication", desc: "Committed to delivering impactful social work and grand events." },
          { title: "Tradition & Progress", desc: "Honoring our roots while embracing modern community development." }
        ]
      }
    };

    function openTimelineModal(key) {
      const data = timelineData[key];
      if (!data) return;
      document.getElementById('timelineTitle').innerText = data.title;
      const wrapper = document.getElementById('timelineWrapper');
      wrapper.innerHTML = data.items.map(item => `
        <div class="timeline-item">
          <div class="timeline-title">${item.title}</div>
          <div class="timeline-desc">${item.desc}</div>
        </div>
      `).join('');
      document.getElementById('timelineModal').classList.remove('hidden');
    }
    window.openTimelineModal = openTimelineModal;
  