interface FormAlertsProps {
  error?: string;
  success?: string;
}

const FormAlerts = ({ error, success }: FormAlertsProps) => {
  return (
    <>
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
          {success}
        </div>
      )}
    </>
  );
};

export default FormAlerts;