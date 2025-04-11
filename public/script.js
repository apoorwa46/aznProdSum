async function fetchSummary() {
    const url = document.getElementById("product-url").value;
    if (!url) {
        alert("Please enter a valid Amazon product URL.");
        return;
    }

    document.getElementById("result").innerText = "Fetching product details...";

    try {
        const response = await fetch("http://localhost:3000/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById("result").innerHTML = `
                <h3>${data.title}</h3>
                <p><strong>Price:</strong> ${data.price}</p>
                <p><strong>Rating:</strong> ${data.rating}</p>
                <p><strong>Summary:</strong> ${data.summary}</p>
            `;
        } else {
            document.getElementById("result").innerText = "Error fetching product details.";
        }
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("result").innerText = "Error fetching product details.";
    }
}
