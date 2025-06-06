import { useState } from "react";


export const FileViewer = ({ fileUrl, isDialogView, set_height }: { fileUrl: any, isDialogView: boolean, set_height: any }) => {
  const extension = fileUrl.split('.').pop().toLowerCase();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });


  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 5)); // max zoom
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 1)); // min zoom
    setPosition({ x: 0, y: 0 }); // reset position if zooming out to base
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
  };

  const handleMouseUp = () => setDragging(false);


  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {

    return isDialogView ? (
      
      <>
        <div className="mb-2 space-x-2 ">
          <div className="zoom_box">
            {/* <div className="zoom_text">Zoom</div> */}
            <button onClick={handleZoomIn}>+</button>
            <button onClick={handleZoomOut}>−</button>
          </div>
        </div>
        <div
          className="relative overflow-hidden border border-gray-300 rounded"
          style={{ width: '99%', height: '400px', cursor: dragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img src={fileUrl} className="img-fluid select-none"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transformOrigin: 'top left',
              transition: dragging ? 'none' : 'transform 0.2s ease',
              userSelect: 'none',
              pointerEvents: 'none' // optional: makes dragging smoother
            }} />;
        </div>
        
      </>
    ) : (<img src={fileUrl} alt="Preview" className="img-fluid" />)
  } else if (extension === 'pdf') {
    return (
      <iframe
        src={fileUrl}
        style={{ width: '100%', height: '600px' }}
        frameBorder="0"
      />
    );
  } else if (['docx', 'xlsx'].includes(extension)) {
    return (
      <iframe
        src={fileUrl}
        style={{ width: '100%', height: '600px' }}
        frameBorder="0"
      />
    );
  } else {
    return <p>Unsupported file format.</p>;
  }
};