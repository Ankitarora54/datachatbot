import { useState } from "react";
import ChatBox from "./components/ChatBox";
import ResultTable from "./components/ResultTable";
import ChartView from "./components/ChartView";

function App() {
  const [data, setData] = useState(null);

  return (
    <div>
      <h1>Chat with Data</h1>
      <ChatBox setData={setData} />
      <ResultTable data={data} />
      <ChartView data={data} />
    </div>
  );
}

export default App;