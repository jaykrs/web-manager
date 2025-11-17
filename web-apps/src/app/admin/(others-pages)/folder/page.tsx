import TabsContainer from "@/components/TabsContainer";

export default function Home() {
  return (
    <div className="min-h-screen p-3 lg:p-20">
      <div className=" lg:px-14 py-5">
        <p className="text-2xl lg:text-4xl font-bold mb-4">
          Media Library
        </p>
        <span className="text-slate-400">
          Image upload to Media Library Content
          API
        </span>
        <TabsContainer />
      </div>
    </div>
  );
}
