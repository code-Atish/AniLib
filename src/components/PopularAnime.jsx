import { useQuery } from "@apollo/client";
import { getAnime } from "../utility/queries";
import PropTypes from 'prop-types';
import Skeleton from "./Skeleton";
import { useDispatch, useSelector } from "react-redux";
import { modifySeason, modifyYear } from "../store/singleInput-slice";
import { ListStructure } from "./Trending";
import { FetchError, NoResults } from "./Error";
import "../assets/styles/App.css";

function getCurrentSeasonAndYear(nextSeason) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1; // Months are 0-based, so we add 1.
  month = month % 12;
  year += month == 0 ? 1 : 0;
  // Define the starting and ending months for each season.
  const seasons = [
    { name: "WINTER", startMonth: 0, endMonth: 2 },
    { name: "SPRING", startMonth: 3, endMonth: 5 },
    { name: "SUMMER", startMonth: 6, endMonth: 8 },
    { name: "FALL", startMonth: 9, endMonth: 11 },
  ];

  // Find the current season based on the month.
  for (let i = 0; i < seasons.length; i++) {
    let season = seasons[i];
    if (month >= season.startMonth && month <= season.endMonth) {
      if (nextSeason) {
        if (season.name == "FALL") {
          return [seasons[(i + 1) % 4].name, year + 1];
        }
        return [seasons[(i + 1) % 4].name, year];
      }
     return [season.name, year];
    }
  }
}

function PopularAnime({ sortCriteria, title, nextSeason }) {
  const dispatch = useDispatch();
  const pageNumber = useSelector((state) => state.page.page);
  const [season, seasonYear] = getCurrentSeasonAndYear(nextSeason);
  const handleView = () => {
    dispatch(modifyYear(seasonYear));
    dispatch(modifySeason(season));
  };
  const { loading, error, data } = useQuery(getAnime, {
    variables: {
      type: "ANIME",
      page: pageNumber,
      perPage: 6,
      sort: sortCriteria,
      season: season,
      seasonYear: seasonYear,
    },
  });
  if (loading) return <Skeleton title={title} length={6} />;
  if (error) return <FetchError msg={error.message} />
  const animeList = Array.from(data.Page.media);
  if (animeList.length == 0) return <NoResults />;
  return (
    <ListStructure
      animeList={animeList}
      handleView={handleView}
      title={title}
    />
  );
}


PopularAnime.propTypes = {
  sortCriteria: PropTypes.string,
  title: PropTypes.string,
  nextSeason: PropTypes.bool,
};


export default PopularAnime;
