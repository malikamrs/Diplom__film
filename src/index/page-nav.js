document.addEventListener("DOMContentLoaded", () => {
    const days = document.querySelectorAll('.page-nav__day');

    days.forEach(day => {
        day.addEventListener('click', (event) => {
            event.preventDefault();

            if (day.classList.contains('page-nav__day_next')) {
                return;
            }
            days.forEach(d => {
                d.classList.remove('page-nav__day_chosen');
                d.classList.remove('page-nav__day_prev');
            });

            day.classList.add('page-nav__day_chosen');

            const prevDay = day.previousElementSibling;
            if (prevDay && prevDay.classList.contains('page-nav__day')) {
                prevDay.classList.add('page-nav__day_prev');
            }
        });
    });
});