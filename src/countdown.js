(function(){
  const hourButtonCount = 6;
  const offsetButtonCount = 6;
  const offsetIncrementMinutes = 5;
  
  window.target = futureTime(1, 0);

  function futureTime(hourOffset, minutes, asof=Date.now()) {
    let now = new Date(asof);
    now.setHours(now.getHours()+hourOffset);
    now.setMinutes(minutes);
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now;
  }

  function hms(seconds) {
    components = [3600, 60] // hms
    if (seconds <= 3600) {
      components = [60] // ms
    }
    
    return components
      .reduceRight(
        (p, b) => r => [Math.floor(r / b)].concat(p(r % b)),
        r => [r]
      )(seconds)
      .map(a => a.toString().padStart(2, '0'))
      .join(':');
  }

  function shouldUpdateHourButtons(now) {
    // Check if buttons have content
    const buttons = document.querySelectorAll('#hours button');
    if (buttons.length === 0 || !buttons[0].innerText) return true;

    // Check if we're near a half-hour boundary (within 2 seconds)
    const epsilon = 2000; // 2 seconds in milliseconds
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const ms = now.getMilliseconds();
    const totalMs = (minutes * 60 + seconds) * 1000 + ms;
    
    // Check proximity to hour or half-hour marks
    const nearHour = Math.abs(totalMs) <= epsilon;
    const nearHalfHour = Math.abs(totalMs - 30 * 60 * 1000) <= epsilon;
    
    return nearHour || nearHalfHour;
  }

  function tick() {
    now = new Date();
    now.setMilliseconds(0);

    if (shouldUpdateHourButtons(now)) {
      updateHourButtons(now);
    }
    updateOffsetButtons(now);

    // update counter
    remaining = window.target - now;
    counter_txt = (remaining > 0) ? hms(Math.floor(remaining/1000)) : 'Done!';
    counter_div = document.getElementById('counter')
    counter_div.className = remaining/1000 >= 3600 ? 'hms' : 'ms';
    //counter_div.style.fontSize = `calc(155vw / ${counter_txt.length})`;
    counter_div.innerHTML = counter_txt;
    document.getElementsByTagName('title')[0].innerHTML = counter_txt;
    document.querySelector('body').className = (remaining/1000 < 0) ? 'done' : (remaining/1000 < 60*5) ? 'soon' : '';

    // audio alerts
    if (remaining == 0) {
      let audio = new Audio('done.mp3');
      audio.play();
    } else if (remaining/1000 == 60*5) {
      let audio = new Audio('warn.mp3');
      audio.play();
    }
  }

  function updateOffsetButtons(now) {
    buttons = document.querySelectorAll('#offsets button');
    offsets = [...Array(offsetButtonCount).keys()].map(x => x*offsetIncrementMinutes + offsetIncrementMinutes);
    for (let i = 0; i < offsetButtonCount; i++) {
      button = buttons[i];
      time = new Date(now);
      time.setMinutes(time.getMinutes() + offsets[i]);
      button.innerText = "+" + offsets[i];
      button.dataset.time = time.toString(); // Convert time to string for dataset storage
    }
  }

  function updateHourButtons(now) {
    const groups = document.querySelectorAll('#hours .hour-group');
    h = 0;
    for (let i = 0; i < hourButtonCount; i++) {
      const group = groups[i];
      const buttons = group.querySelectorAll('button');
      
      // Create hour button
      const hourButton = buttons[0];
      const time = futureTime(h, 0, now);
      hourButton.innerText = time.getHours() > 12 ? time.getHours() - 12 : time.getHours() != 0 ? time.getHours() : 12;
      hourButton.dataset.time = time.toString(); // Convert time to string for dataset storage
      const ispast = (time - now < 0);
      const within_target = (time <= window.target);
      hourButton.disabled = ispast;
      (ispast) ? hourButton.classList.add('disabled') : hourButton.classList.remove('disabled');
      (within_target) ? hourButton.classList.add('within-target') : hourButton.classList.remove('within-target');
      
      // Create half-hour button
      const halfHourButton = buttons[1];
      const halfHourTime = futureTime(h, 30, now);
      halfHourButton.innerText = ":" + halfHourTime.getMinutes();
      halfHourButton.dataset.time = halfHourTime.toString(); // Convert time to string for dataset storage
      const halfHourIspast = (halfHourTime - now < 0);
      const halfHourWithin_target = (halfHourTime <= window.target);
      halfHourButton.disabled = halfHourIspast;
      (halfHourIspast) ? halfHourButton.classList.add('disabled') : halfHourButton.classList.remove('disabled');
      (halfHourWithin_target) ? halfHourButton.classList.add('within-target') : halfHourButton.classList.remove('within-target');
      
      h += 1;
    }
  }


  document.addEventListener("DOMContentLoaded", function() {

    function setTarget(){
      console.log('setTarget clicked', this.dataset.time);
      window.target = new Date(this.dataset.time);
      console.log('new target set to:', window.target);
      
      // Force an immediate update
      const now = new Date();
      updateHourButtons(now);
      updateOffsetButtons(now);
      
      // Force counter update
      remaining = window.target - now;
      counter_txt = (remaining > 0) ? hms(Math.floor(remaining/1000)) : 'Done!';
      counter_div = document.getElementById('counter')
      counter_div.className = remaining/1000 >= 3600 ? 'hms' : 'ms';
      counter_div.innerHTML = counter_txt;
      document.getElementsByTagName('title')[0].innerHTML = counter_txt;
      document.querySelector('body').className = (remaining/1000 < 0) ? 'done' : (remaining/1000 < 60*5) ? 'soon' : '';
    }

    // create a button per hour, and per half hour
    controls = document.getElementById('hours');
    for(let i=0; i<hourButtonCount; i++){
      // Create a group for each hour/half-hour pair
      const group = document.createElement('span');
      group.className = 'hour-group';
      
      // Create hour button
      const hourButton = document.createElement('button');
      hourButton.addEventListener('click', setTarget);
      group.appendChild(hourButton);
      
      // Create half-hour button
      const halfHourButton = document.createElement('button');
      halfHourButton.addEventListener('click', setTarget);
      group.appendChild(halfHourButton);
      
      controls.appendChild(group);
    }

    // Initialize the hour buttons
    updateHourButtons(new Date());

    // create a button for future offsets (e.g. +5 minutes, +10 minutes)
    controls = document.getElementById('offsets');
    for(let i=0; i<offsetButtonCount; i++){
      button = document.createElement('button');
      button.addEventListener('click', setTarget);
      controls.append(button);
    }

    setInterval(tick, 1000);
  });

})()
