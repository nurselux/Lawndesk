'use client';

export default function SentryExamplePage() {
  return (
    <div style={{ padding: '40px' }}>
      <h1>Sentry Example Page</h1>
      <p>Click the button below to trigger a test error and send it to Sentry:</p>

      <button
        onClick={() => {
          throw new Error('Test error from Sentry example page');
        }}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Trigger Test Error
      </button>
    </div>
  );
}
