import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Camera } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showVideoOptions, setShowVideoOptions] = useState(false);
  const [videoPreview, setVideoPreview] = useState(null);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }
    // Resize image to max 1280x1280
    const img = new window.Image();
    img.onload = () => {
      const maxDim = 1280;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob.size > 2 * 1024 * 1024) {
          toast.error("Resized image is still too large (max 2MB)");
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(blob);
      }, file.type, 0.92);
    };
    const reader = new FileReader();
    reader.onload = (ev) => {
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Video must be less than 10MB");
      return;
    }
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  };

  const handleStartRecording = async () => {
    setShowVideoOptions(false);
    setRecording(true);
    setVideoPreview(null);
    setRecordedChunks([]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const recorder = new window.MediaRecorder(stream);
      setMediaRecorder(recorder);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) setRecordedChunks((prev) => [...prev, e.data]);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setVideoPreview(url);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
    } catch (err) {
      toast.error("Could not access camera");
      setRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const handleSendVideo = async () => {
    if (!videoPreview) return;
    try {
      const res = await fetch(videoPreview);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = async () => {
        await sendMessage({ text: text.trim(), video: reader.result });
        setVideoPreview(null);
        setText("");
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      toast.error("Failed to send video");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !videoPreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
        video: videoPreview,
      });

      // Clear form
      setText("");
      setImagePreview(null);
      setVideoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <input
            type="file"
            accept="video/*"
            className="hidden"
            ref={videoInputRef}
            onChange={handleVideoChange}
          />

          <button
            type="button"
            className={`flex btn btn-circle ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
          <div className="relative">
            <button
              type="button"
              className="flex btn btn-circle text-zinc-400 ml-1"
              onClick={() => setShowVideoOptions((v) => !v)}
            >
              <Camera size={20} />
            </button>
            {showVideoOptions && (
              <div className="absolute right-0 bottom-full mb-2 bg-base-100 border border-base-300 rounded shadow-lg z-50 w-40">
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-base-200"
                  onClick={() => {
                    setShowVideoOptions(false);
                    videoInputRef.current?.click();
                  }}
                >
                  Send from Gallery
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-base-200"
                  onClick={handleStartRecording}
                >
                  Record a Video
                </button>
              </div>
            )}
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview && !videoPreview}
        >
          <Send size={22} />
        </button>
      </form>

      {videoPreview && (
        <div className="mt-3 flex flex-col items-start gap-2">
          <video src={videoPreview} controls className="w-40 rounded-lg border border-zinc-700" />
          {recording ? (
            <button className="btn btn-error btn-xs" onClick={handleStopRecording}>Stop Recording</button>
          ) : (
            <button className="btn btn-primary btn-xs" onClick={handleSendVideo}>Send Video</button>
          )}
        </div>
      )}
    </div>
  );
};
export default MessageInput;
