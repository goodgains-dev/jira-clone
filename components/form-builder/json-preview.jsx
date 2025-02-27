"use client";

export function JsonPreview({ fields, formName, formDescription }) {
  const formJson = {
    name: formName,
    description: formDescription,
    fields: fields.map(({ id, ...rest }) => rest)
  };
  
  return (
    <div className="p-4 border rounded-md bg-gray-800 overflow-auto max-h-[500px]">
      <pre className="text-xs text-white">{JSON.stringify(formJson, null, 2)}</pre>
      
      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>No fields added yet. Add fields in the Builder tab to see the JSON structure.</p>
        </div>
      )}
    </div>
  );
}
