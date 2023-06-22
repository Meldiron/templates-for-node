# ChatGPT Article Summarizer Function

This function enables the automatic generation of blog post summaries using OpenAI's GPT-3 model. Upon creation of a blog post document in Appwrite, this function will automatically trigger and generate a summary for the blog post content.

## Environment Variables

To ensure the function operates as intended, ensure the following variables are set:

- **APPWRITE_ENDPOINT**: This is the endpoint of your Appwrite instance. You can find it in your Appwrite console.
- **APPWRITE_PROJECT_ID**: This is the ID of your Appwrite project. You can find it in your Appwrite console.
- **APPWRITE_API_KEY**: This is your Appwrite API key. You should create a key with sufficient permissions in the Appwrite console.
- **OPENAI_API_KEY**: This is your OpenAI API key. You can generate it from the OpenAI platform.
- **BLOG_DATABASE_ID**: This is the ID of your database in Appwrite where blog posts are stored.
- **BLOG_COLLECTION_ID**: This is the ID of your collection in Appwrite where blog posts are stored.

## Appwrite Setup

This function assumes you have a collection in Appwrite for storing your blog posts. The collection should have at least the following attributes:

- **title**: The title of the blog post.
- **content**: The actual content of the blog post.
- **summary**: A field to store the generated summary.

## Usage

This function runs automatically upon the creation of a blog post document in your Appwrite collection. The function:

1. Validates that the triggering event is the creation of a document in the correct collection.
2. Retrieves the new document and extracts the blog post content.
3. Sends a request to the OpenAI API, asking it to generate a summary of the blog post content.
4. Updates the blog post document in Appwrite with the generated summary.


## Setting Up OpenAI API

In order to use this function, you'll need an OpenAI API key. You can get this key from the OpenAI platform by following these steps:

1. Visit the [OpenAI website](https://openai.com) and sign up for an account if you haven't already.
2. Navigate to the API section in the dashboard.
3. Here, you'll find your API key which you can use for this function.

Note: The OpenAI API is a paid service. Please review the pricing details and terms of use on the OpenAI website before proceeding.