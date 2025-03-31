import sys
import requests
import os
# --- Configuration & Constants (hardcoded) ---
GITHUB_API_URL = "https://api.github.com"
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
MODEL_NAME = "o3-mini"
MIN_DIFF_SIZE = 100

# Our base prompt without the diff.
BASE_PROMPT = (
    "You are a seasoned code reviewer. Please analyze the following cumulative code diff for our backend and provide a strong but to the point review for the PR. Only comment on changes directly introduced in the diff — ignore unrelated assumptions or suggestions or hallucinations. Follow these instructions regarding content perfectly. Format your response in Markdown with the following structure:\n\n # PR Code Review Analysis\n\n ## Summary:\n Consicely summarize the changes introduced in the diff. No additional comments. No points about adding todos. No points about changing ENVs. No points about double checking. \n\n ## Changes:\n To the point bullet points listing only functional code changes. Ignore formatting, styling, test updates, or unrelated improvements.\n\n ## Detailed Observations:\n Bullet points listing only functional issues or potential bugs directly introduced in the diff. No generic suggestions (like check accessibility or verify behavior). No points about changing styles/tailwind classes. No points about adding todos. No points about changing ENVs. No points about double checking. No points about changing regex and constants/text changes or updates. \n\n ## Fixes and Improvements:\n Bullet points listing actionable recommendations to take care of any fixes. We are using React19 and TailwindV4 with a Node backend. Only include specific, value-adding improvements or corrections related to core functionalities that appear in the diff. No points about changing regex and constants/text changes.No points about adding todos. Do not mention testing, accessibility, or behavioral verification unless clearly broken in the code diff itself. Do not mention validation or double checking or verifying the constants . Rate bug fixes, 3 or 5 or 8 or 10. 10 being a super critical -fix-now urgent bug."
)

# Retrieve configuration from environment variables or hardcoded for local testing
OWNER = os.getenv("OWNER")
REPO = os.getenv("REPO")
PR_NUMBER = os.getenv("PR_NUMBER")

# Retrieve tokens from environment variables or hardcoded for local testing
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# --- Helper Functions ---

def get_changed_files(owner: str, repo: str, pr_number: int, github_token: str):
    """
    Retrieve the list of changed files (with patch/diff data) in a PR.
    """
    url = f"{GITHUB_API_URL}/repos/{owner}/{repo}/pulls/{pr_number}/files"
    headers = {
        "Authorization": f"Bearer {github_token}",
        "Accept": "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

def calculate_diff_size(diff_text: str):
    """
    Calculate the size of the diff by counting added and removed characters.
    """
    added_count = diff_text.count("\n+")
    removed_count = diff_text.count("\n-")
    return added_count + removed_count
def post_comment(review):
    url = f"{GITHUB_API_URL}/repos/{OWNER}/{REPO}/issues/{PR_NUMBER}/comments"
    comment = {"body": review}
    response = requests.post(url, headers={
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }, json=comment)
    response.raise_for_status()

def call_openai_api(prompt: str, openai_api_key: str):
    """
    Call OpenAI's API with the provided prompt and return the response text.
    """
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {openai_api_key}"
    }
    body = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "user", "content": prompt}
        ]
        # "max_tokens" and "temperature" parameters can be added here if needed.
    }
    response = requests.post(OPENAI_API_URL, headers=headers, json=body)
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]

def save_review_to_file(filename: str, content: str):
    """
    Save the review content to a text file.
    """
    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Saved review to {filename}")

def main():
    print(f"Fetching changed files for PR #{PR_NUMBER} in {OWNER}/{REPO}...")
    files = get_changed_files(OWNER, REPO, int(PR_NUMBER), GITHUB_TOKEN)

    # Extensions to ignore
    ignore_extensions = (
        '.yml', '.css', '.json', '.lock', '.env', '.txt', 
        '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', 
        '.ttf', '.woff', '.woff2', '.eot', '.otf'
    )

    aggregated_diff = ""
    total_diff_size = 0
    for file_info in files:
        filename = file_info.get("filename")
        patch = file_info.get("patch")

        # Skip if there's no patch (e.g. binary file).
        if not patch:
            print(f"Skipping {filename} (no patch available)")
            continue

        # Skip if the file extension is in the ignored list.
        if filename.lower().endswith(ignore_extensions):
            print(f"Skipping {filename} (ignored file extension)")
            continue

        # Append a header for each file to clearly separate diffs.
        aggregated_diff += f"\n### File: {filename}\n{patch}\n"
        total_diff_size += calculate_diff_size(patch)

    if not aggregated_diff.strip():
        print("No applicable diffs found to review.")
        return
    
    if total_diff_size < MIN_DIFF_SIZE:
        print(f"Total diff size ({total_diff_size}) is less than {MIN_DIFF_SIZE}. Skipping AI review.")
        return

    # Create the prompt for the entire PR
    prompt = BASE_PROMPT + aggregated_diff
    print("Sending aggregated diff to OpenAI API...")
    try:
        review_response = call_openai_api(prompt, OPENAI_API_KEY)
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return

    output_filename = "pr_review_summary.txt"
    save_review_to_file(output_filename, review_response)

    print("Posting review comment...")
    post_comment(review_response)

    if os.path.exists(output_filename):
        print("Logging AI PR Review...")
        with open(output_filename, "r") as f:
            print(f.read())
    else:
        print("No AI PR Review found.")

if __name__ == "__main__":
    main()