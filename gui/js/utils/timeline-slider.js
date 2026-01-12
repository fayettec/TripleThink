/**
 * Timeline Slider Utility
 * Reusable timeline slider component for temporal navigation
 */

const TimelineSlider = {
  instances: new Map(),

  create(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return null;
    }

    const instance = {
      id: containerId,
      container,
      startDate: options.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      endDate: options.endDate || new Date(),
      currentTime: options.currentTime || new Date(),
      events: options.events || [],
      onChange: options.onChange || (() => {}),
      onPlay: options.onPlay || (() => {}),
      onPause: options.onPause || (() => {}),
      isPlaying: false,
      playInterval: null
    };

    this.instances.set(containerId, instance);
    this.render(instance);

    return instance;
  },

  render(instance) {
    const { container, startDate, endDate, currentTime, events } = instance;

    // Calculate position
    const totalSpan = endDate.getTime() - startDate.getTime();
    const currentPosition = ((currentTime.getTime() - startDate.getTime()) / totalSpan) * 100;

    container.innerHTML = `
      <div class="timeline-slider-container">
        <div class="timeline-slider-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2);">
          <div class="timeline-slider-date" style="font-size: var(--font-size-sm); color: var(--color-gray-600);">
            ${formatters.formatDate(currentTime)}
          </div>
          <div class="timeline-slider-controls">
            <button class="btn btn-sm btn-secondary" onclick="TimelineSlider.play('${instance.id}')">
              ${instance.isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button class="btn btn-sm btn-secondary" onclick="TimelineSlider.reset('${instance.id}')">
              Reset
            </button>
          </div>
        </div>

        <div class="timeline-slider-track" style="position: relative; height: 40px; background: var(--color-gray-100); border-radius: var(--radius-md); padding: 0 8px;">
          <!-- Event markers -->
          ${events.map((evt, idx) => {
            const evtTime = new Date(evt.timestamp);
            if (evtTime < startDate || evtTime > endDate) return '';

            const evtPosition = ((evtTime.getTime() - startDate.getTime()) / totalSpan) * 100;

            return `
              <div
                class="timeline-event-marker"
                style="position: absolute; left: ${evtPosition}%; top: 50%; transform: translateY(-50%); width: 8px; height: 8px; background: var(--color-primary-500); border-radius: 50%; cursor: pointer;"
                title="${evt.summary || evt.id}"
                onclick="TimelineSlider.jumpToEvent('${instance.id}', ${idx})"
              ></div>
            `;
          }).join('')}

          <!-- Slider input -->
          <input
            type="range"
            id="${instance.id}-slider"
            min="0"
            max="100"
            value="${currentPosition}"
            step="0.1"
            style="position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer;"
            oninput="TimelineSlider.handleSliderChange('${instance.id}', this.value)"
          >

          <!-- Current position indicator -->
          <div
            class="timeline-slider-handle"
            style="position: absolute; left: ${currentPosition}%; top: 50%; transform: translate(-50%, -50%); width: 16px; height: 16px; background: var(--color-primary-600); border: 2px solid white; border-radius: 50%; pointer-events: none; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"
          ></div>
        </div>

        <div class="timeline-slider-labels" style="display: flex; justify-content: space-between; margin-top: var(--space-1); font-size: var(--font-size-xs); color: var(--color-gray-500);">
          <span>${formatters.formatDate(startDate)}</span>
          <span>${formatters.formatDate(endDate)}</span>
        </div>
      </div>
    `;
  },

  handleSliderChange(instanceId, value) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    const { startDate, endDate } = instance;
    const totalSpan = endDate.getTime() - startDate.getTime();
    const newTime = new Date(startDate.getTime() + (totalSpan * value / 100));

    instance.currentTime = newTime;
    this.render(instance);

    if (instance.onChange) {
      instance.onChange(newTime);
    }
  },

  play(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    if (instance.isPlaying) {
      this.pause(instanceId);
    } else {
      instance.isPlaying = true;

      instance.playInterval = setInterval(() => {
        const { startDate, endDate, currentTime } = instance;

        // Advance by 1 day
        const newTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);

        if (newTime >= endDate) {
          this.pause(instanceId);
          return;
        }

        instance.currentTime = newTime;
        this.render(instance);

        if (instance.onChange) {
          instance.onChange(newTime);
        }
      }, 500); // Advance every 500ms

      this.render(instance);

      if (instance.onPlay) {
        instance.onPlay();
      }
    }
  },

  pause(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    instance.isPlaying = false;

    if (instance.playInterval) {
      clearInterval(instance.playInterval);
      instance.playInterval = null;
    }

    this.render(instance);

    if (instance.onPause) {
      instance.onPause();
    }
  },

  reset(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    this.pause(instanceId);
    instance.currentTime = instance.startDate;
    this.render(instance);

    if (instance.onChange) {
      instance.onChange(instance.currentTime);
    }
  },

  jumpToEvent(instanceId, eventIndex) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    const event = instance.events[eventIndex];
    if (!event) return;

    instance.currentTime = new Date(event.timestamp);
    this.render(instance);

    if (instance.onChange) {
      instance.onChange(instance.currentTime);
    }
  },

  setEvents(instanceId, events) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    instance.events = events;
    this.render(instance);
  },

  getCurrentTime(instanceId) {
    const instance = this.instances.get(instanceId);
    return instance ? instance.currentTime : null;
  },

  destroy(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    this.pause(instanceId);
    this.instances.delete(instanceId);
  }
};

// Make globally accessible
window.TimelineSlider = TimelineSlider;
