# Contributing to Heymarket API

We love your input! We want to make contributing to Heymarket API as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## We Develop with Github
We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## We Use [Github Flow](https://guides.github.com/introduction/flow/index.html)
Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `master`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Any contributions you make will be under the MIT Software License
In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using Github's [issue tracker](https://github.com/xzmaxtoy/heymarket/issues)
We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/xzmaxtoy/heymarket/issues/new/choose).

## Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can.
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Development Process

1. Create a feature branch from master
2. Write your code and tests
3. Update documentation if needed
4. Submit a pull request
5. Code review
6. Merge to master

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a .env file with required environment variables
4. Run tests: `npm test`
5. Start development server: `npm run dev`

## Environment Variables

Required environment variables:
- `PORT`: Server port (default: 3000)
- `HEYMARKET_API_KEY`: Your Heymarket API key
- `NODE_ENV`: Environment (development/production)

## License
By contributing, you agree that your contributions will be licensed under its MIT License.
