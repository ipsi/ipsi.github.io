console.log(window.onload);
window.addEventListener('load', () => {
    const form = document.getElementById("contactme");
    form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        document.getElementById("post-success").style.display = "none";
        document.getElementById("post-failure").style.display = "none";
        document.getElementById("error-message").innerHTML = "";
        try {
            let r = await fetch(form.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams(new FormData(form))
            });
            if (r.status < 300) {
                document.getElementById("post-success").style.display = "block";
            } else {
                let body = await r.json();
                document.getElementById("error-message").innerHTML = `${body.status}, ${body.message}`;
                document.getElementById("post-failure").style.display = "block";
            }
        } catch (e) {
            document.getElementById("error-message").innerHTML = `${e}`;
            document.getElementById("post-failure").style.display = "block";
        }
    })
});