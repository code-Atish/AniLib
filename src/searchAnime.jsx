import React from "react";
import { useQuery } from "@apollo/client";
import { getAnime } from "./queries/queries";
import Skeleton from "./Skeleton";
import { secondsToDhms, truncateSentence } from "./converTime";
import InfiniteScroll from "react-infinite-scroll-component";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./App.css";
import "./skeleton.css";
import { ListStructure } from "./ui/Trending";

function isElementOutsideViewport(index) {
  const el = document.getElementsByClassName("tooltip")[index];
  console.log({ el });
  const rect = el?.getBoundingClientRect();
  if (rect)
    return (
      rect.top < 0 ||
      rect.left < 0 ||
      rect.right > window.innerWidth ||
      rect.bottom > window.innerHeight
    );
  return false;
}

const RenderElements = ({ array }) => {
  const chunkSize = 5;

  const renderDivs = () => {
    const divs = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      const AnimeList = array.slice(i, i + chunkSize);
      divs.push(<DisplaySearchData animeList={AnimeList} />);
    }
    return divs;
  };

  return (
    <>
      {renderDivs().map((divs, index) => (
        <div className="trending-list" key={index}>
          {divs}
        </div>
      ))}
    </>
  );
};

const DisplaySearchData = ({ animeList, hasMore }) => {
  const searchComponent = true;
  return (
    <ListStructure
      hasMore={hasMore}
      animeList={animeList}
      searchComponent={searchComponent}
    />
  );
};

function DisplaySearch({ sortCriteria, filterOptions }) {
  const controller = new AbortController();
  const { signal } = controller;
  sortCriteria = sortCriteria || "POPULARITY_DESC";
  const [perPage, setPerPage] = useState(5);
  const [pageNumber, setPageNumber] = useState(2);
  const [hasMore, setHasMore] = useState(true);
  const [name, format, year, season, genre, status, source] = filterOptions;
  const { loading, error, data, fetchMore } = useQuery(getAnime, {
    variables: {
      search: name,
      page: 1,
      perPage: 10,
      sort: sortCriteria,
      format_in: format,
      season: season,
      seasonYear: year,
      genre_in: genre,
      status: status,
      source: source,
    },
  });
  const fetchMoreData = () => {
    setPageNumber((prev) => prev + 1);
    fetchMore({
      variables: {
        page: pageNumber,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult || fetchMoreResult.Page.media.length === 0) {
          setHasMore(false);
          return prev;
        }
        return {
          Page: {
            ...prev.Page,
            media: [...prev.Page.media, ...fetchMoreResult.Page.media],
          },
        };
      },
      context:  {
        // Attach the signal to the context
        fetchOptions: {
          signal,
        },
      },
    });
  };

  useEffect(() => {
    setPerPage(
      getComputedStyle(
        document.querySelector(".trending-list")
      ).getPropertyValue("--childNum")
    );
    console.log(perPage);
    return () => controller.abort();
  }, []);
  
  if (loading) return <Skeleton length={6} />;
  if (error) return <p>Error : {error.message}</p>;

  const animeList = data?.Page.media || [];
  return (
    animeList.length > 0 && (
      <InfiniteScroll
        dataLength={animeList.length}
        next={fetchMoreData}
        hasMore={hasMore}
        loader={<></>}
        endMessage={
          <p style={{ textAlign: "center" }}>Yay! You have seen it all</p>
        }
      >
        <ListStructure
          animeList={animeList}
          hasMore={hasMore}
          searchComponent={true}
        />
      </InfiniteScroll>
    )
  );
}

export default DisplaySearch;
