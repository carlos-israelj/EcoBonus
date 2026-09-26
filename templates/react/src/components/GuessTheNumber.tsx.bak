import { useState } from "react"

export const GuessTheNumber = () => {
	const [result, setResult] = useState<"idle" | "success" | "failure">("idle")

	const submitGuess = async (formData: FormData) => {
		const guess = formData.get("guess")
		if (typeof guess != "string" || !guess) {
			setResult("failure")
			return
		}

		setResult(guess === "7" ? "success" : "failure")
	}

	const reset = () => setResult("idle")

	return (
		<div className="guess-the-number">
			<form action={submitGuess}>
				<input
					placeholder="Guess a number from 1 to 10!"
					id="guess"
					type="number"
					min="1"
					max="10"
					onChange={reset}
				/>
				<button type="submit">
					Submit
				</button>
			</form>

			{result === "success" && (
				<div className="card guess-result guess-result--success">
					<p>
						You got it! Play again by calling <code>reset</code> in the Contract
						Explorer.
					</p>
				</div>
			)}
			{result === "failure" && (
				<div className="card guess-result guess-result--failure">
					<p>Incorrect guess. Try again!</p>
				</div>
			)}
		</div>
	)
}
