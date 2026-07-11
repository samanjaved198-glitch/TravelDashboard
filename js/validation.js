/* =====================================================================
   validation.js — reusable form validation helpers
===================================================================== */

const Validate = {
  required(value) {
    return String(value || '').trim().length > 0;
  },
  email(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  },
  phone(value) {
    return /^[\d+\-\s()]{7,20}$/.test(String(value || '').trim());
  },
  minNumber(value, min) {
    return Number(value) >= min;
  },
  notPastDate(value) {
    if (!value) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const picked = new Date(value);
    return picked >= today;
  },

  /**
   * Marks a .form-group as valid/invalid and toggles its error message.
   * @param {HTMLElement} inputEl - the input/select element
   * @param {boolean} isValid
   */
  setFieldState(inputEl, isValid) {
    const group = inputEl.closest('.form-group');
    if (!group) return;
    group.classList.toggle('invalid', !isValid);
  },

  /**
   * Validates the booking form. Returns { valid, data }.
   */
  validateBookingForm() {
    let valid = true;

    const destinationEl = document.getElementById('b-destination');
    const dateEl = document.getElementById('b-date');
    const travelersEl = document.getElementById('b-travelers');
    const priceEl = document.getElementById('b-price');

    const destOk = this.required(destinationEl.value);
    this.setFieldState(destinationEl, destOk);
    valid = valid && destOk;

    const dateOk = this.required(dateEl.value);
    this.setFieldState(dateEl, dateOk);
    valid = valid && dateOk;

    const travelersOk = this.minNumber(travelersEl.value, 1);
    this.setFieldState(travelersEl, travelersOk);
    valid = valid && travelersOk;

    const priceOk = this.minNumber(priceEl.value, 0);
    this.setFieldState(priceEl, priceOk);
    valid = valid && priceOk;

    return {
      valid,
      data: {
        destination: destinationEl.value.trim(),
        date: dateEl.value,
        travelers: Number(travelersEl.value),
        price: Number(priceEl.value),
        status: document.getElementById('b-status').value
      }
    };
  }
};

window.Validate = Validate;
