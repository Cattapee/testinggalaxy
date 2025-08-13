document.addEventListener("DOMContentLoaded", (event) => {
  const box = document.getElementById("controls"); // Updated to match index.html
  let hidden = 69;

  document.addEventListener("keydown", (event) => {
    if (event.key === "m" || event.key === "M") {
      if (hidden === 69) {
        box.style.display = "none";
        hidden = 70;
      } else {
        box.style.display = "flex"; // Matches flex display in index.html
        hidden = 69;
      }
    }
  });

  const paramMap = {
    hemisphere_light_intensity: "HEMISPHERE_LIGHT_INTENSITY",
    point_light_intensity: 'POINT_LIGHT_INTENSITY',
    num_lights: 'NUM_POINT_LIGHTS',
    num_stars: 'NUM_STARS',
    galaxy_thickness: 'GALAXY_THICKNESS',
    core_x_dist: 'CORE_X_DIST',
    core_y_dist: 'CORE_Y_DIST',
    outer_core_x_dist: 'OUTER_CORE_X_DIST',
    outer_core_y_dist: 'OUTER_CORE_Y_DIST',
    arm_x_dist: 'ARM_X_DIST',
    arm_y_dist: 'ARM_Y_DIST',
    arm_x_mean: 'ARM_X_MEAN',
    arm_y_mean: 'ARM_Y_MEAN',
    spiral: 'SPIRAL',
    arms: 'ARMS',
    bar_length: 'BAR_LENGTH',
    bar_width: 'BAR_WIDTH',
    halo_radius: 'HALO_RADIUS',
    halo_density: 'HALO_DENSITY',
    arm_pitch: 'ARM_PITCH',
    star_size_variance: 'STAR_SIZE_VARIANCE',
    nebula_density: 'NEBULA_DENSITY',
    nebula_scale_min: 'NEBULA_SCALE_MIN',
    nebula_scale_max: 'NEBULA_SCALE_MAX',
    shader_type: 'SHADER_TYPE',
  };

  Object.keys(paramMap).forEach((id) => {
    const input = document.getElementById(id);
    if (input && window.config) {
      if (input.tagName === 'SELECT') {
        input.value = window.config[paramMap[id]];
        input.addEventListener('change', (e) => {
          window.config[paramMap[id]] = e.target.value;
          if (window.updateGalaxyParameters) window.updateGalaxyParameters();
        });
      } else {
        input.value = window.config[paramMap[id]];
        input.addEventListener('input', (e) => {
          window.config[paramMap[id]] = parseFloat(e.target.value);
          if (window.updateGalaxyParameters) window.updateGalaxyParameters();
        });
      }
    }
  });
});