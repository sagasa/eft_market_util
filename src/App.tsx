import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';


import logo from './logo.svg';
import './App.css';

import { request, gql } from 'graphql-request';
import { styled } from '@mui/material';

const query = gql`
{
    items(lang: en) {
        id
        name
    		iconLink
    		buyFor{
          vendor{
            normalizedName
          }
          priceRUB
        }
    		historicalPrices{
          price
          priceMin
          timestamp
        }
    }
}
`;

type APIItem = {
  id: string;
  name: string;
  iconLink: string;
  buyFor: {
    vendor: {
      normalizedName: string;
    };
    priceRUB: number;
  }[];
  historicalPrices: {
    price: number;
    priceMin: number;
    timestamp: string;
  }[];
};

type APIResponseData = {
  items: APIItem[];
}

type ItemEntry = {
  id: string;
  name: string;
  icon: string;

  lowestTraderPrice?: number;

  marketMinPriceMin: number;
  marketMinPriceMax: number;

  marketPriceMin: number;
  marketPriceMax: number;

  marketPriceDiff: number;
  marketPriceDiffPercentage: number;

  traderPriceDiff?: number;
  traderPriceDiffPercentage?: number;
}


const cacheKey = 'tarkovItems';
const cacheExpiryKey = 'tarkovItemsExpiry';


function callApi(): Promise<ItemEntry[]> {
  return request<APIResponseData>('https://api.tarkov.dev/graphql', query)
    .then((data) => {
      // Handle the data here
      const items = data.items.filter(item => {
        return item.historicalPrices.length > 0;
      }).map((item) => {
        const lowestPrice = item.historicalPrices.reduce((acc, price) => {
          return Math.min(acc, price.price);
        }, item.historicalPrices[0].price);
        const highestPrice = item.historicalPrices.reduce((acc, price) => {
          return Math.max(acc, price.price);
        }, item.historicalPrices[0].price);

        const lowestPriceMin = item.historicalPrices.reduce((acc, price) => {
          return Math.min(acc, price.priceMin);
        }, item.historicalPrices[0].priceMin);
        const highestPriceMin = item.historicalPrices.reduce((acc, price) => {
          return Math.max(acc, price.priceMin);
        }, item.historicalPrices[0].priceMin);

        const buyFor = item.buyFor.filter(buyFor => buyFor.vendor.normalizedName !== 'flea-market');
        const lowestTraderPrice = buyFor.length == 0 ? undefined : buyFor.reduce((acc, buyFor) => {
          return Math.min(acc, buyFor.priceRUB);
        }, item.buyFor[0].priceRUB);

        const marketPriceDiff = highestPrice - lowestPrice;
        const marketPriceDiffPercentage = marketPriceDiff / lowestPrice * 100;
        const traderPriceDiff = lowestTraderPrice ? lowestPrice - lowestTraderPrice : undefined;
        const traderPriceDiffPercentage = lowestTraderPrice ? traderPriceDiff! / lowestTraderPrice * 100 : undefined;

        const entry: ItemEntry = {
          id: item.id,
          name: item.name,
          icon: item.iconLink,
          lowestTraderPrice: lowestTraderPrice,
          marketMinPriceMin: lowestPriceMin,
          marketMinPriceMax: highestPriceMin,
          marketPriceMin: lowestPrice,
          marketPriceMax: highestPrice,

          marketPriceDiff: marketPriceDiff,
          marketPriceDiffPercentage: marketPriceDiffPercentage,
          traderPriceDiff: traderPriceDiff,
          traderPriceDiffPercentage: traderPriceDiffPercentage
        };
        return entry;
      });
      return items;
    });
}

const items: Promise<ItemEntry[]> = new Promise((resolve, reject) => {
  const cachedData = localStorage.getItem(cacheKey);
  const cachedExpiry = localStorage.getItem(cacheExpiryKey);

  if (cachedExpiry && cachedData && new Date().getTime() < JSON.parse(cachedExpiry)) {
    console.log('Data is still valid');
    const parsedData: ItemEntry[] = JSON.parse(cachedData);
    resolve(parsedData);
  } else {
    console.log('Data is expired');
    callApi().then((data) => {
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(cacheExpiryKey, JSON.stringify(new Date().getTime() + 1000 * 60 * 60 * 24));
      resolve(data);
    }).catch((error) => {
      reject(error);
    });
  }
});


const ItemsTraderPriceDiff = items.then((data) => {
  return [...data].sort((a, b) => {
    // traderPriceDiffがあるものを優先
    if (a.traderPriceDiff !== undefined && b.traderPriceDiff === undefined) {
      return -1;
    }
    if (a.traderPriceDiff === undefined && b.traderPriceDiff !== undefined) {
      return 1;
    }
    // traderPriceDiffが大きいものを優先
    return b.traderPriceDiff! - a.traderPriceDiff!;
  });
});

const ItemsMarketPriceDiff = items.then((data) => {
  return [...data].sort((a, b) => {
    return b.marketPriceDiff - a.marketPriceDiff;
  });
});

const ItemsMarketPriceDiffPercentage = items.then((data) => {
  return [...data].sort((a, b) => {
    return b.marketPriceDiffPercentage - a.marketPriceDiffPercentage;
  });
});

const StyledTableCell = styled(TableCell)({
  padding: '4px', // Set top and bottom padding to 4px
});

console.log('Hello World!');
// Make the GraphQL request

function ItemMarketPriceDiffList(items: ItemEntry[]) {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell align="right">Market Price Min</TableCell>
            <TableCell align="right">Market Price Max</TableCell>
            <TableCell align="right">Market Price Diff</TableCell>
            <TableCell align="right">Market Price Diff Percentage&nbsp;(%)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <StyledTableCell component="th" scope="row"
                sx={{
                  display:'flex',
                  alignItems:'center'
                }}
              >
                <img
                  src={item.icon}
                  alt={item.name}
                  loading="lazy"
                  style={{ width: '48px', height: '48px', marginRight: '8px' }}
                />
                {item.name}
              </StyledTableCell>
              <StyledTableCell align="right">{item.marketPriceMin}</StyledTableCell>
              <StyledTableCell align="right">{item.marketPriceMax}</StyledTableCell>
              <StyledTableCell align="right">{item.marketPriceDiff}</StyledTableCell>
              <StyledTableCell align="right">{item.marketPriceDiffPercentage.toFixed(2)}</StyledTableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function App() {
  const [items, setItems] = React.useState<ItemEntry[]>([]);

  ItemsMarketPriceDiffPercentage.then((data) => {
    setItems(data);
  });


  return (
    <div className="App">

      {ItemMarketPriceDiffList(items)}

      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn
        </a>
      </header>
    </div>
  );
}

export default App;
