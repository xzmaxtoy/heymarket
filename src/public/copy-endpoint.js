// Plugin to add copy buttons to Swagger UI operations
const CopyEndpointPlugin = function() {
  return {
    wrapComponents: {
      // Add copy button to operation header
      OperationSummary: (Original, { React }) => (props) => {
        const [isCopied, setIsCopied] = React.useState(false);
        const [isLoading, setIsLoading] = React.useState(false);
        
        const waitForElement = (selector, parent, timeout = 2000) => {
          return new Promise((resolve, reject) => {
            const element = parent.querySelector(selector);
            if (element) return resolve(element);

            const observer = new MutationObserver((mutations) => {
              const element = parent.querySelector(selector);
              if (element) {
                observer.disconnect();
                resolve(element);
              }
            });

            observer.observe(parent, {
              childList: true,
              subtree: true
            });

            setTimeout(() => {
              observer.disconnect();
              resolve(null);
            }, timeout);
          });
        };

        const copyEndpoint = async () => {
          try {
            // Get the operation container
            const opContainer = document.querySelector(`[data-path="${props.path}"][data-method="${props.method}"]`);
            if (!opContainer) return;

            // Expand the operation if it's not already expanded
            const isExpanded = opContainer.classList.contains('is-open');
            if (!isExpanded) {
              opContainer.querySelector('.opblock-summary').click();
              // Wait for content to load
              await Promise.all([
                waitForElement('.parameters-container', opContainer),
                waitForElement('.responses-wrapper', opContainer)
              ]);
              // Give a small delay for any animations to complete
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Create a temporary div to hold formatted content
            const tempDiv = document.createElement('div');

            // Add endpoint title and description
            const methodEl = opContainer.querySelector('.opblock-summary-method');
            const pathEl = opContainer.querySelector('.opblock-summary-path');
            const descEl = opContainer.querySelector('.opblock-description');
            tempDiv.innerHTML += `${methodEl.textContent} ${pathEl.textContent}\n`;
            if (descEl) {
                tempDiv.innerHTML += `Description: ${descEl.textContent.trim()}\n`;
            }
            tempDiv.innerHTML += '\n';

            // Add Parameters section if it exists
            const paramsSection = opContainer.querySelector('.parameters-container');
            if (paramsSection) {
                tempDiv.innerHTML += 'Parameters:\n';
                const params = paramsSection.querySelectorAll('.parameters tr:not(.parameters-header)');
                params.forEach(param => {
                    const name = param.querySelector('.parameter__name')?.textContent || '';
                    const type = param.querySelector('.parameter__type')?.textContent || '';
                    const required = param.querySelector('.parameter__required')?.textContent || '';
                    const desc = param.querySelector('.parameter__description')?.textContent || '';
                    tempDiv.innerHTML += `  ${name} (${type})${required ? ' required' : ''}\n    Description: ${desc.trim()}\n\n`;
                });
            }

            // Add Request Body if it exists
            const requestBody = opContainer.querySelector('.body-param');
            if (requestBody) {
                tempDiv.innerHTML += 'Request Body:\n';
                const schema = requestBody.querySelector('.body-param-schema');
                if (schema) {
                    // Format the schema JSON if possible
                    try {
                        const schemaText = schema.textContent;
                        const schemaJson = JSON.parse(schemaText);
                        tempDiv.innerHTML += JSON.stringify(schemaJson, null, 2).split('\n').map(line => '  ' + line).join('\n') + '\n\n';
                    } catch {
                        tempDiv.innerHTML += '  ' + schema.textContent.split('\n').join('\n  ') + '\n\n';
                    }
                }
            }

            // Add Responses section
            const responses = opContainer.querySelector('.responses-wrapper');
            if (responses) {
                tempDiv.innerHTML += 'Responses:\n';
                const codes = responses.querySelectorAll('.responses-table tr:not(.responses-header)');
                codes.forEach(code => {
                    const status = code.querySelector('.response-col_status')?.textContent || '';
                    const desc = code.querySelector('.response-col_description')?.textContent || '';
                    tempDiv.innerHTML += `  ${status}:\n    Description: ${desc.trim()}\n`;
                    
                    // Add response schema if it exists
                    const schema = code.querySelector('.response-col_description pre');
                    if (schema) {
                        tempDiv.innerHTML += '    Schema:\n';
                        try {
                            const schemaJson = JSON.parse(schema.textContent);
                            tempDiv.innerHTML += JSON.stringify(schemaJson, null, 2).split('\n').map(line => '      ' + line).join('\n') + '\n';
                        } catch {
                            tempDiv.innerHTML += '      ' + schema.textContent.split('\n').join('\n      ') + '\n';
                        }
                    }
                    tempDiv.innerHTML += '\n';
                });
            }

            // Copy the formatted content
            await navigator.clipboard.writeText(tempDiv.innerText);

            // If we expanded the operation, collapse it back
            if (!isExpanded) {
              opContainer.querySelector('.opblock-summary').click();
            }

            return true;
          } catch (error) {
            console.error('Failed to copy endpoint:', error);
            return false;
          }
        };

        return React.createElement('div', { 
          className: 'opblock-summary',
          style: { 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            width: '100%',
            padding: '5px'
          }
        },
          React.createElement(Original, props),
          React.createElement('button', {
            className: 'copy-button',
            onClick: async () => {
              if (isLoading || isCopied) return;
              try {
                setIsLoading(true);
                const success = await copyEndpoint();
                if (success) {
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                }
              } catch (error) {
                console.error('Failed to copy:', error);
              } finally {
                setIsLoading(false);
              }
            },
            disabled: isLoading || isCopied,
            'data-path': props.path,
            'data-method': props.method,
            style: {
              padding: '5px 10px',
              border: '1px solid #49cc90',
              borderRadius: '4px',
              background: isCopied ? '#49cc90' : isLoading ? '#e8e8e8' : 'transparent',
              color: isCopied ? 'white' : isLoading ? '#666' : '#49cc90',
              cursor: isLoading || isCopied ? 'default' : 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.7 : 1
            }
          }, [
            React.createElement('span', { 
              key: 'icon',
              role: 'img', 
              'aria-label': isLoading ? 'loading' : isCopied ? 'success' : 'copy',
              style: {
                display: 'inline-block',
                animation: isLoading ? 'spin 1s linear infinite' : 'none'
              }
            }, isLoading ? '⟳' : isCopied ? '✓' : '📋'),
            React.createElement('span', { 
              key: 'text'
            }, isLoading ? 'Copying...' : isCopied ? 'Copied!' : 'Copy')
          ]),
          React.createElement('style', null, `
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `)
        );
      }
    }
  };
};
