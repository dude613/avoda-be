import sys
import requests
import os
import time

# --- Configuration & Constants (hardcoded) ---
GITHUB_API_URL = "https://api.github.com"
OPENAI_THREAD_URL = "https://api.openai.com/v1/threads"
OPENAI_ASSISTANT_ID = "asst_JUTY7WIQ6hsKWEKWcVhQL78u"
MODEL_NAME = "gpt4o-mini"
MIN_DIFF_SIZE = 75

# Our base prompt without the diff.
BASE_PROMPT = (
    "You are a seasoned code reviewer. Please analyze the following cumulative code diff - probably mainly for the backend - and provide a strong but to the point review for the PR. Only comment on changes directly introduced in the diff — ignore unrelated assumptions or suggestions or hallucinations. Follow these instructions regarding content perfectly, do not hallucinate and ensure that you are following the directions as a whole since they apply to each section. Format your response in Markdown with the following structure:\r\n\r\n"
    "# PR Code Review Analysis\r\n\r\n"
    "## Summary:\r\nConcise summary of the changes introduced in the diff. No additional comments. No points about adding todos. No points about changing ENVs. No points about double checking.\r\n\r\n"
    "## Changes:\r\nTo the point bullet points listing only functional code changes. Ignore formatting, styling, test updates, or unrelated improvements. Write the file name after the period of each bullet point.\r\n\r\n"
    "## Detailed Observations:\r\nBullet points listing only functional issues or potential bugs directly introduced in the diff. No generic suggestions (like check accessibility or verify behavior). No points about changing styles or adding todos.\r\n\r\n"
    "## Fixes and Improvements:\r\nBullet points listing actionable recommendations for fixes. We are using Node/Express/Postgres/Prisma. Only include specific, value-adding improvements or corrections related to core functionalities that appear in the diff. Write the file name for each bullet point at the end in parentheses.\r\n"
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

def create_thread():
    """Create a new thread with the OpenAI assistant."""
    response = requests.post(OPENAI_THREAD_URL, headers=openai_headers(), json={})
    response.raise_for_status()
    return response.json()["id"]

def add_message(thread_id, content):
    """Add a message to the OpenAI thread."""
    url = f"{OPENAI_THREAD_URL}/{thread_id}/messages"
    response = requests.post(url, headers=openai_headers(), json={"role": "user", "content": content})
    response.raise_for_status()

def run_assistant(thread_id):
    """Run the assistant for the given thread."""
    url = f"{OPENAI_THREAD_URL}/{thread_id}/runs"
    response = requests.post(url, headers=openai_headers(), json={"assistant_id": OPENAI_ASSISTANT_ID})
    response.raise_for_status()
    return response.json()["id"]

def wait_for_completion(thread_id, run_id):
    """Wait for the assistant run to complete."""
    url = f"{OPENAI_THREAD_URL}/{thread_id}/runs/{run_id}"
    while True:
        response = requests.get(url, headers=openai_headers())
        status = response.json()["status"]
        if status in ["completed", "failed"]:
            return status
        time.sleep(2)

def fetch_response(thread_id):
    """Fetch the response from the assistant."""
    url = f"{OPENAI_THREAD_URL}/{thread_id}/messages"
    response = requests.get(url, headers=openai_headers())
    return response.json()["data"][0]["content"][0]["text"]["value"]

def openai_headers():
    """Return the headers required for OpenAI API calls."""
    return {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2"
    }

def get_existing_comments():
    """
    Fetch all comments for a given PR to check if a previous review comment exists.
    """
    url = f"{GITHUB_API_URL}/repos/{OWNER}/{REPO}/issues/{PR_NUMBER}/comments"
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

def find_existing_pr_review_comment(comments):
    """
    Check for an existing PR review comment that contains the PR Code Review Analysis markdown header.
    Returns the comment ID if found, otherwise returns None.
    """
    for comment in comments:
        if "Detailed Observations:" in comment["body"]:
            return comment["id"]
    return None

def delete_existing_comment(comment_id):
    """
    Delete an existing PR review comment with the given comment ID.
    """
    url = f"{GITHUB_API_URL}/repos/{OWNER}/{REPO}/issues/comments/{comment_id}"
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }
    response = requests.delete(url, headers=headers)
    if response.status_code == 204:
        print(f"Existing comment {comment_id} deleted successfully.")
    else:
        print(f"Failed to delete comment {comment_id}. Status code: {response.status_code}")
        print(f"Response: {response.text}")
        try:
            response.raise_for_status()
        except Exception as e:
            print(f"Exception: {e}")

def post_comment(review: str):
    """
    Post a new comment with the PR review analysis.
    """
    url = f"{GITHUB_API_URL}/repos/{OWNER}/{REPO}/issues/{PR_NUMBER}/comments"
    comment = {"body": review}
    response = requests.post(url, headers={
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }, json=comment)
    response.raise_for_status()

def save_review_to_file(filename: str, content: str):
    """
    Save the review content to a text file.
    """
    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Saved review to {filename}")

def main():
    """
    Main function to perform the PR review process.
    """
    print(f"Fetching changed files for PR #{PR_NUMBER} in {OWNER}/{REPO}...")
    files = get_changed_files(OWNER, REPO, int(PR_NUMBER), GITHUB_TOKEN)

    # Extensions to ignore
    ignore_extensions = (
        '.yml', '.css', '.json', '.lock', '.env', '.txt', 
        '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', 
        '.ttf', '.woff', '.woff2', '.eot', '.otf', '.webp', 
        '.md', '.htm', '.xml', '.jsonld', '.csv', '.yaml', 
        '.yml', '.toml'
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
        total_diff_size += calculate_diff_size(patch) # Accumulate total diff size

    if not aggregated_diff.strip():
        print("No applicable diffs found to review.")
        return

    # Check if a previous review comment exists
    comments = get_existing_comments()
    existing_comment_id = find_existing_pr_review_comment(comments)
    if existing_comment_id:
        print(f"Found existing review comment {existing_comment_id}. Deleting...")
        delete_existing_comment(existing_comment_id)

    if total_diff_size < MIN_DIFF_SIZE:
        print(f"Total diff size ({total_diff_size}) is less than {MIN_DIFF_SIZE}. Posting comment and skipping AI review.")
        small_diff_comment = f"Skipping AI review: Total diff size ({total_diff_size} characters) is below the minimum threshold of {MIN_DIFF_SIZE} characters."
        try:
            post_comment(small_diff_comment)
            print("Posted comment indicating diff is too small.")
        except Exception as e:
            print(f"Error posting 'too small' comment: {e}")
        return  # Exit after posting the comment

    # Create the prompt for the entire PR
    print("Creating thread and sending diff to assistant...")
    thread_id = create_thread()
    add_message(thread_id, BASE_PROMPT + "\n\n" + aggregated_diff)
    run_id = run_assistant(thread_id)
    status = wait_for_completion(thread_id, run_id)

    if status == "completed":
        review = fetch_response(thread_id)
        post_comment(review)
        print("Review posted successfully.")
    else:
        print("Assistant run failed.")

if __name__ == "__main__":
    main()