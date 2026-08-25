
      function toggleArcadeZone() {
        const content = document.getElementById('arcade-games-content');
        const chevron = document.getElementById('arcade-chevron');
        if (content.style.display === 'none') {
          content.style.display = 'grid';
          chevron.style.transform = 'rotate(180deg)';
        } else {
          content.style.display = 'none';
          chevron.style.transform = 'rotate(0deg)';
        }
      }
    